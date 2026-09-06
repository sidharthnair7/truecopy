package fileidea.truecopy.translate;

import com.anthropic.client.AnthropicClient;
import com.anthropic.client.okhttp.AnthropicOkHttpClient;
import com.anthropic.errors.AnthropicIoException;
import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.errors.RateLimitException;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.StructuredMessageCreateParams;
import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.protect.ProtectedTokens;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "truecopy.llm", name = "provider", havingValue = "anthropic")
public class ClaudeTranslator implements Translator {

    private final TrueCopyProperties properties;
    private volatile AnthropicClient client;

    @Override
    public String activeModel() {
        return properties.getAnthropic().getModel();
    }

    @Override
    public Translation translate(String sourceLanguage, String targetLanguage, String title, String description, ProtectedTokens tokens) {
        String user = TranslationPrompt.user(sourceLanguage, targetLanguage, title, description, tokens);
        try {
            StructuredMessageCreateParams<TranslationOutput> params = MessageCreateParams.builder()
                    .model(properties.getAnthropic().getModel())
                    .maxTokens(8_000L)
                    .outputConfig(TranslationOutput.class)
                    .system(TranslationPrompt.SYSTEM)
                    .addUserMessage(user)
                    .build();
            TranslationOutput output = client().messages().create(params).content().stream()
                    .flatMap(block -> block.text().stream())
                    .map(text -> text.text())
                    .findFirst()
                    .orElseThrow(() -> new TranslationException("Model returned no content for " + targetLanguage));
            return Translation.builder()
                    .language(targetLanguage)
                    .title(output.title() == null ? "" : output.title().strip())
                    .description(output.description() == null ? "" : output.description())
                    .build();
        } catch (RateLimitException e) {
            throw new TranslationException("Anthropic rate limit hit while translating to " + targetLanguage, e);
        } catch (AnthropicServiceException e) {
            throw new TranslationException("Anthropic API error while translating to " + targetLanguage + ": " + e.getMessage(), e);
        } catch (AnthropicIoException e) {
            throw new TranslationException("Could not reach the Anthropic API while translating to " + targetLanguage, e);
        }
    }

    private AnthropicClient client() {
        AnthropicClient existing = client;
        if (existing != null) {
            return existing;
        }
        synchronized (this) {
            if (client == null) {
                String key = properties.getAnthropic().getApiKey();
                client = key == null || key.isBlank()
                        ? AnthropicOkHttpClient.fromEnv()
                        : AnthropicOkHttpClient.builder().apiKey(key).build();
                log.info("Anthropic client initialised with model {}", properties.getAnthropic().getModel());
            }
            return client;
        }
    }
}
