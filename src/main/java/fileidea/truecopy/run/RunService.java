package fileidea.truecopy.run;

import fileidea.truecopy.api.dto.RunRequest;
import fileidea.truecopy.auth.GoogleAuthService;
import fileidea.truecopy.auth.LiveRunsDisabledException;
import fileidea.truecopy.auth.NotConnectedException;
import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.youtube.QuotaMeter;
import fileidea.truecopy.youtube.YouTubeClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RunService {

    private final RunRepository repository;
    private final RunExecutor executor;
    private final GoogleAuthService auth;
    private final YouTubeClient youtube;
    private final TrueCopyProperties properties;
    private final QuotaMeter quota;

    public Run start(RunRequest request) {
        if (!auth.isConnected()) {
            throw new NotConnectedException();
        }
        if (!request.isDryRun() && !properties.isAllowLiveRuns()) {
            throw new LiveRunsDisabledException();
        }
        List<String> languages = request.getLanguages() == null || request.getLanguages().isEmpty()
                ? properties.getLanguages()
                : request.getLanguages().stream().map(String::strip).map(String::toLowerCase).distinct().toList();
        if (languages.isEmpty()) {
            throw new IllegalArgumentException("At least one target language is required");
        }
        int max = request.getMaxVideos() == null || request.getMaxVideos() < 1 ? 10 : Math.min(request.getMaxVideos(), 200);
        List<String> videoIds = request.getVideoIds() == null || request.getVideoIds().isEmpty()
                ? youtube.uploadVideoIds(max)
                : request.getVideoIds().stream().map(String::strip).distinct().toList();
        if (videoIds.isEmpty()) {
            throw new IllegalArgumentException("The connected channel has no uploads to localize");
        }
        String sourceLanguage = request.getSourceLanguage() == null || request.getSourceLanguage().isBlank()
                ? properties.getSourceLanguage()
                : request.getSourceLanguage().strip().toLowerCase();

        Run run = Run.builder()
                .id(UUID.randomUUID().toString().substring(0, 8))
                .status(RunStatus.QUEUED)
                .dryRun(request.isDryRun())
                .sourceLanguage(sourceLanguage)
                .languages(languages)
                .createdAt(Instant.now())
                .videosRequested(videoIds.size())
                .quotaBudget(quota.budget())
                .quotaUsed(quota.used())
                .build();
        repository.save(run);
        executor.execute(run.getId(), videoIds);
        return run;
    }

    public Run get(String id) {
        return repository.find(id).orElseThrow(() -> new IllegalArgumentException("Run not found: " + id));
    }

    public List<Run> all() {
        return repository.all();
    }
}
