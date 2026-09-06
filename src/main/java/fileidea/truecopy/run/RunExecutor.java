package fileidea.truecopy.run;

import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoLocalization;
import fileidea.truecopy.gate.Gate;
import fileidea.truecopy.gate.GateResult;
import fileidea.truecopy.protect.ProtectedTokens;
import fileidea.truecopy.protect.TokenExtractor;
import fileidea.truecopy.translate.Translation;
import fileidea.truecopy.translate.TranslationException;
import fileidea.truecopy.translate.Translator;
import fileidea.truecopy.youtube.QuotaMeter;
import fileidea.truecopy.youtube.Readback;
import fileidea.truecopy.youtube.YouTubeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RunExecutor {

    private static final int READBACK_ATTEMPTS = 4;
    private static final long READBACK_DELAY_MILLIS = 3_000;

    private final RunRepository repository;
    private final YouTubeClient youtube;
    private final Translator translator;
    private final Gate gate;
    private final TokenExtractor extractor;
    private final QuotaMeter quota;

    @Async
    public void execute(String runId, List<String> videoIds) {
        Run run = repository.find(runId).orElseThrow();
        run.setStatus(RunStatus.RUNNING);
        run.setStartedAt(Instant.now());
        run.setQuotaBudget(quota.budget());
        run.setLanguagesTotal(videoIds.size() * run.getLanguages().size());
        repository.save(run);
        try {
            for (String videoId : videoIds) {
                VideoResult result = processVideo(run, videoId);
                run.getVideos().add(result);
                run.setVideosProcessed(run.getVideosProcessed() + 1);
                tally(run, result);
                run.setQuotaUsed(quota.used());
                repository.save(run);
            }
            run.setStatus(RunStatus.COMPLETED);
        } catch (Exception e) {
            log.error("Run {} failed", runId, e);
            run.setStatus(RunStatus.FAILED);
            run.setError(e.getMessage());
        } finally {
            run.setFinishedAt(Instant.now());
            run.setQuotaUsed(quota.used());
            run.setCurrentVideoId(null);
            run.setCurrentVideoTitle(null);
            run.setCurrentLanguage(null);
            repository.save(run);
        }
    }

    private VideoResult processVideo(Run run, String videoId) {
        long quotaBefore = quota.used();
        VideoResult result = VideoResult.builder().videoId(videoId).build();
        try {
            Video video = youtube.video(videoId);
            String sourceTitle = video.getSnippet().getTitle();
            String sourceDescription = video.getSnippet().getDescription() == null ? "" : video.getSnippet().getDescription();
            result.setSourceTitle(sourceTitle);
            result.setThumbnailUrl(youtube.summary(video).getThumbnailUrl());
            run.setCurrentVideoId(videoId);
            run.setCurrentVideoTitle(sourceTitle);

            String defaultLanguage = video.getSnippet().getDefaultLanguage();
            if (defaultLanguage == null || defaultLanguage.isBlank()) {
                defaultLanguage = run.getSourceLanguage();
                video.getSnippet().setDefaultLanguage(defaultLanguage);
                result.setDefaultLanguageSet(true);
            }
            result.setDefaultLanguage(defaultLanguage);

            ProtectedTokens tokens = extractor.extract(sourceTitle + "\n" + sourceDescription);
            List<LanguageResult> languageResults = translateAll(run, defaultLanguage, sourceTitle, sourceDescription, tokens);
            result.setLanguages(languageResults);

            Map<String, VideoLocalization> passing = new LinkedHashMap<>();
            for (LanguageResult lr : languageResults) {
                if (lr.getOutcome() == LanguageOutcome.PUBLISHED) {
                    VideoLocalization loc = new VideoLocalization();
                    loc.setTitle(lr.getTitle());
                    loc.setDescription(lr.getDescription());
                    passing.put(lr.getLanguage(), loc);
                }
            }

            if (run.isDryRun()) {
                languageResults.stream()
                        .filter(lr -> lr.getOutcome() == LanguageOutcome.PUBLISHED)
                        .forEach(lr -> lr.setOutcome(LanguageOutcome.VERIFIED_DRY_RUN));
            } else if (!passing.isEmpty()) {
                long needed = QuotaMeter.UPDATE + passing.size() * QuotaMeter.LIST;
                if (!quota.canSpend(needed)) {
                    passing.keySet().forEach(lang -> fail(languageResults, lang,
                            "Not published: " + needed + " quota units needed, " + quota.remaining() + " remaining today"));
                } else {
                    youtube.publishLocalizations(video, passing);
                    run.setCurrentLanguage(null);
                    repository.save(run);
                    for (String lang : passing.keySet()) {
                        LanguageResult lr = languageResults.stream().filter(x -> x.getLanguage().equals(lang)).findFirst().orElseThrow();
                        for (int attempt = 1; attempt <= READBACK_ATTEMPTS; attempt++) {
                            Readback readback = youtube.readback(videoId, lang);
                            lr.setReadbackTitle(readback.getTitle());
                            lr.setReadbackMatched(lr.getTitle().equals(readback.getTitle()));
                            if (lr.getReadbackMatched()) {
                                break;
                            }
                            log.info("Readback for {} [{}] not yet propagated (attempt {}/{}): YouTube returned '{}'", videoId, lang, attempt, READBACK_ATTEMPTS, readback.getTitle());
                            if (attempt < READBACK_ATTEMPTS) {
                                sleep(READBACK_DELAY_MILLIS);
                            }
                        }
                        if (!lr.getReadbackMatched()) {
                            log.warn("Readback mismatch for {} [{}]: sent '{}', YouTube returned '{}'", videoId, lang, lr.getTitle(), lr.getReadbackTitle());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Video {} failed in run {}", videoId, run.getId(), e);
            result.setError(e.getMessage());
            for (LanguageResult lr : result.getLanguages()) {
                if (lr.getOutcome() == LanguageOutcome.PUBLISHED) {
                    lr.setOutcome(LanguageOutcome.FAILED);
                    lr.setError(e.getMessage());
                }
            }
        }
        result.setQuotaUsed(quota.used() - quotaBefore);
        return result;
    }

    private List<LanguageResult> translateAll(Run run, String defaultLanguage, String title, String description, ProtectedTokens tokens) {
        List<LanguageResult> results = new ArrayList<>();
        for (String lang : run.getLanguages()) {
            if (lang.equalsIgnoreCase(defaultLanguage)) {
                results.add(LanguageResult.builder()
                        .language(lang)
                        .outcome(LanguageOutcome.SKIPPED)
                        .error("Same as the video's default language")
                        .build());
                continue;
            }
            LanguageResult lr = LanguageResult.builder().language(lang).build();
            run.setCurrentLanguage(lang);
            repository.save(run);
            long started = System.currentTimeMillis();
            try {
                Translation translation = translator.translate(run.getSourceLanguage(), lang, title, description, tokens);
                lr.setTranslationMillis(System.currentTimeMillis() - started);
                lr.setTitle(translation.getTitle());
                lr.setDescription(translation.getDescription());
                GateResult verdict = gate.check(title, description, translation.getTitle(), translation.getDescription());
                if (verdict.isPassed()) {
                    lr.setOutcome(LanguageOutcome.PUBLISHED);
                } else {
                    lr.setOutcome(LanguageOutcome.REFUSED);
                    lr.setFailures(verdict.getFailures());
                    log.info("REFUSED {} for [{}]: {}", lang, title, verdict.getFailures());
                }
            } catch (TranslationException e) {
                lr.setTranslationMillis(System.currentTimeMillis() - started);
                lr.setOutcome(LanguageOutcome.FAILED);
                lr.setError(e.getMessage());
            }
            results.add(lr);
            run.setLanguagesDone(run.getLanguagesDone() + 1);
            repository.save(run);
        }
        return results;
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void fail(List<LanguageResult> results, String language, String message) {
        results.stream().filter(lr -> lr.getLanguage().equals(language)).forEach(lr -> {
            lr.setOutcome(LanguageOutcome.FAILED);
            lr.setError(message);
        });
    }

    private void tally(Run run, VideoResult result) {
        for (LanguageResult lr : result.getLanguages()) {
            switch (lr.getOutcome()) {
                case PUBLISHED, VERIFIED_DRY_RUN -> {
                    run.setAttempted(run.getAttempted() + 1);
                    run.setPublished(run.getPublished() + 1);
                }
                case REFUSED -> {
                    run.setAttempted(run.getAttempted() + 1);
                    run.setRefused(run.getRefused() + 1);
                }
                case FAILED -> {
                    run.setAttempted(run.getAttempted() + 1);
                    run.setFailed(run.getFailed() + 1);
                }
                case SKIPPED -> run.setSkipped(run.getSkipped() + 1);
            }
        }
    }
}
