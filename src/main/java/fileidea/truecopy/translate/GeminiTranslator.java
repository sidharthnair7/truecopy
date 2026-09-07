package fileidea.truecopy.translate;

import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.protect.ProtectedTokens;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "truecopy.llm", name = "provider", havingValue = "gemini", matchIfMissing = true)
public class GeminiTranslator implements Translator {

    private static final int MAX_ATTEMPTS = 4;
    private static final long FIRST_BACKOFF_MILLIS = 2_000;
    private static final long MAX_BACKOFF_MILLIS = 70_000;
    private static final long WINDOW_MILLIS = 60_000;
    private static final Pattern RETRY_HINT = Pattern.compile("retry in ([0-9.]+)\\s*s", Pattern.CASE_INSENSITIVE);

    private final TrueCopyProperties properties;
    private final ObjectMapper mapper;
    private final Deque<Long> recentCalls = new ArrayDeque<>();
    private final AtomicInteger modelIndex = new AtomicInteger();
    private volatile RestClient rest;

    @Override
    public String activeModel() {
        List<String> models = models();
        return models.get(Math.min(modelIndex.get(), models.size() - 1));
    }

    @Override
    public Translation translate(String sourceLanguage, String targetLanguage, String title, String description, ProtectedTokens tokens) {
        String key = properties.getGemini().getApiKey();
        if (key == null || key.isBlank()) {
            throw new TranslationException("GEMINI_API_KEY is not set. Create a free key at https://aistudio.google.com/apikey and put it in .env before starting the server.");
        }
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", TranslationPrompt.SYSTEM))),
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", TranslationPrompt.user(sourceLanguage, targetLanguage, title, description, tokens))))),
                "generationConfig", Map.of(
                        "temperature", 0,
                        "responseMimeType", "application/json",
                        "responseSchema", Map.of(
                                "type", "OBJECT",
                                "properties", Map.of(
                                        "title", Map.of("type", "STRING"),
                                        "description", Map.of("type", "STRING")),
                                "required", List.of("title", "description"))));

        long backoff = FIRST_BACKOFF_MILLIS;
        List<String> exhausted = new ArrayList<>();
        for (int attempt = 1; ; attempt++) {
            String model = activeModel();
            acquireSlot();
            try {
                Map<?, ?> response = client().post()
                        .uri("/v1beta/models/{model}:generateContent", model)
                        .header("x-goog-api-key", key)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .body(Map.class);
                return parse(targetLanguage, model, response);
            } catch (RestClientResponseException e) {
                int status = e.getStatusCode().value();
                if (status == 429 && dailyQuotaExhausted(e)) {
                    exhausted.add(model);
                    if (advanceModel(model)) {
                        log.warn("Daily free quota exhausted for {}; switching to {}", model, activeModel());
                        attempt--;
                        continue;
                    }
                    throw new TranslationException("Daily free-tier quota exhausted for every configured Gemini model " + exhausted
                            + ". Quotas reset at midnight Pacific; add another model to truecopy.gemini.models or enable billing.", e);
                }
                boolean retryable = status == 429 || status == 503 || status == 500;
                if (retryable && attempt < MAX_ATTEMPTS) {
                    long wait = Math.min(MAX_BACKOFF_MILLIS, Math.max(backoff, retryHintMillis(e)));
                    log.warn("Gemini {} returned {} for {} (attempt {}/{}), retrying in {} ms", model, status, targetLanguage, attempt, MAX_ATTEMPTS, wait);
                    sleep(wait);
                    backoff = Math.min(MAX_BACKOFF_MILLIS, backoff * 2);
                    continue;
                }
                throw new TranslationException("Gemini API error " + status + " from " + model + " while translating to " + targetLanguage + ": " + errorMessage(e), e);
            } catch (ResourceAccessException e) {
                if (attempt < MAX_ATTEMPTS) {
                    log.warn("Gemini unreachable for {} (attempt {}/{}), retrying in {} ms", targetLanguage, attempt, MAX_ATTEMPTS, backoff);
                    sleep(backoff);
                    backoff = Math.min(MAX_BACKOFF_MILLIS, backoff * 2);
                    continue;
                }
                throw new TranslationException("Could not reach the Gemini API while translating to " + targetLanguage, e);
            }
        }
    }

    private List<String> models() {
        List<String> models = properties.getGemini().getModels();
        if (models == null || models.isEmpty()) {
            throw new TranslationException("truecopy.gemini.models is empty");
        }
        return models;
    }

    private boolean advanceModel(String failedModel) {
        synchronized (modelIndex) {
            List<String> models = models();
            int current = modelIndex.get();
            if (current < models.size() && models.get(current).equals(failedModel) && current + 1 < models.size()) {
                modelIndex.set(current + 1);
                return true;
            }
            return current < models.size() - 1 || !models.get(Math.min(current, models.size() - 1)).equals(failedModel);
        }
    }

    private boolean dailyQuotaExhausted(RestClientResponseException e) {
        String raw = e.getResponseBodyAsString();
        try {
            Map<?, ?> parsed = mapper.readValue(raw, Map.class);
            if (parsed.get("error") instanceof Map<?, ?> error && error.get("details") instanceof List<?> details) {
                for (Object detail : details) {
                    if (detail instanceof Map<?, ?> d && d.get("violations") instanceof List<?> violations) {
                        for (Object v : violations) {
                            if (v instanceof Map<?, ?> vm && vm.get("quotaId") instanceof String id && id.contains("PerDay")) {
                                return true;
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return raw.contains("PerDay");
    }

    /**
     * Sliding window over the last minute. Google allows the whole allowance to
     * be spent in a burst and only then makes you wait, so spacing calls evenly
     * would add up to a minute of dead time to a three language run for no gain.
     */
    private void acquireSlot() {
        int limit = Math.max(1, properties.getGemini().getRequestsPerMinute());
        long waitMillis;
        synchronized (recentCalls) {
            long now = System.currentTimeMillis();
            while (!recentCalls.isEmpty() && now - recentCalls.peekFirst() >= WINDOW_MILLIS) {
                recentCalls.pollFirst();
            }
            if (recentCalls.size() < limit) {
                recentCalls.addLast(now);
                return;
            }
            waitMillis = WINDOW_MILLIS - (now - recentCalls.peekFirst()) + 250;
        }
        log.info("Gemini window of {} req/min is full, waiting {} ms", limit, waitMillis);
        sleep(waitMillis);
        acquireSlot();
    }

    private long retryHintMillis(RestClientResponseException e) {
        String raw = e.getResponseBodyAsString();
        try {
            Map<?, ?> parsed = mapper.readValue(raw, Map.class);
            if (parsed.get("error") instanceof Map<?, ?> error && error.get("details") instanceof List<?> details) {
                for (Object detail : details) {
                    if (detail instanceof Map<?, ?> d && d.get("retryDelay") instanceof String delay) {
                        return (long) (Double.parseDouble(delay.replace("s", "")) * 1000) + 1_000;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        Matcher m = RETRY_HINT.matcher(raw);
        if (m.find()) {
            return (long) (Double.parseDouble(m.group(1)) * 1000) + 1_000;
        }
        return 0;
    }

    private Translation parse(String targetLanguage, String model, Map<?, ?> response) {
        Object feedback = response == null ? null : response.get("promptFeedback");
        if (feedback instanceof Map<?, ?> fb && fb.get("blockReason") != null) {
            throw new TranslationException("Gemini blocked the request for " + targetLanguage + ": " + fb.get("blockReason"));
        }
        String text = extractText(response);
        if (text == null || text.isBlank()) {
            throw new TranslationException("Gemini " + model + " returned no content for " + targetLanguage);
        }
        TranslationOutput output;
        try {
            output = mapper.readValue(text, TranslationOutput.class);
        } catch (Exception e) {
            throw new TranslationException("Gemini " + model + " returned non-JSON content for " + targetLanguage + ": " + text, e);
        }
        return Translation.builder()
                .language(targetLanguage)
                .title(output.title() == null ? "" : output.title().strip())
                .description(output.description() == null ? "" : output.description())
                .build();
    }

    private String extractText(Map<?, ?> response) {
        if (response == null || !(response.get("candidates") instanceof List<?> candidates) || candidates.isEmpty()) {
            return null;
        }
        if (!(candidates.getFirst() instanceof Map<?, ?> candidate) || !(candidate.get("content") instanceof Map<?, ?> content)) {
            return null;
        }
        if (!(content.get("parts") instanceof List<?> parts)) {
            return null;
        }
        StringBuilder sb = new StringBuilder();
        for (Object part : parts) {
            if (part instanceof Map<?, ?> p && p.get("text") instanceof String s) {
                sb.append(s);
            }
        }
        return sb.toString();
    }

    private String errorMessage(RestClientResponseException e) {
        String raw = e.getResponseBodyAsString();
        try {
            Map<?, ?> parsed = mapper.readValue(raw, Map.class);
            if (parsed.get("error") instanceof Map<?, ?> error && error.get("message") instanceof String message) {
                return message;
            }
        } catch (Exception ignored) {
        }
        return raw.isBlank() ? e.getStatusText() : raw;
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TranslationException("Interrupted while waiting to retry Gemini", e);
        }
    }

    private RestClient client() {
        RestClient existing = rest;
        if (existing != null) {
            return existing;
        }
        synchronized (this) {
            if (rest == null) {
                rest = RestClient.builder().baseUrl(properties.getGemini().getBaseUrl()).build();
                log.info("Gemini client initialised, models {} at {} req/min", models(), properties.getGemini().getRequestsPerMinute());
            }
            return rest;
        }
    }
}
