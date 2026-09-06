package fileidea.truecopy.run;

import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoLocalization;
import fileidea.truecopy.api.dto.AuditRequest;
import fileidea.truecopy.auth.GoogleAuthService;
import fileidea.truecopy.auth.NotConnectedException;
import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.gate.Gate;
import fileidea.truecopy.gate.GateResult;
import fileidea.truecopy.youtube.QuotaMeter;
import fileidea.truecopy.youtube.YouTubeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final GoogleAuthService auth;
    private final YouTubeClient youtube;
    private final Gate gate;
    private final QuotaMeter quota;
    private final TrueCopyProperties properties;

    public AuditResult audit(AuditRequest request) {
        if (!auth.isConnected()) {
            throw new NotConnectedException();
        }
        long quotaBefore = quota.used();
        int max = request.getMaxVideos() == null || request.getMaxVideos() < 1 ? 25 : Math.min(request.getMaxVideos(), 200);
        List<String> ids = request.getVideoIds() == null || request.getVideoIds().isEmpty()
                ? youtube.uploadVideoIds(max)
                : request.getVideoIds().stream().map(String::strip).distinct().toList();
        List<AuditResult.AuditVideo> videos = new ArrayList<>();
        int localizations = 0;
        int passed = 0;
        int refused = 0;
        for (Video video : youtube.videos(ids)) {
            String sourceTitle = video.getSnippet().getTitle();
            String sourceDescription = video.getSnippet().getDescription() == null ? "" : video.getSnippet().getDescription();
            String defaultLanguage = video.getSnippet().getDefaultLanguage() == null || video.getSnippet().getDefaultLanguage().isBlank()
                    ? properties.getSourceLanguage()
                    : video.getSnippet().getDefaultLanguage();
            List<AuditResult.AuditLanguage> languages = new ArrayList<>();
            Map<String, VideoLocalization> existing = video.getLocalizations();
            if (existing != null) {
                for (Map.Entry<String, VideoLocalization> entry : existing.entrySet()) {
                    if (entry.getKey().equalsIgnoreCase(defaultLanguage)) {
                        continue;
                    }
                    VideoLocalization loc = entry.getValue();
                    GateResult verdict = gate.check(sourceTitle, sourceDescription, loc.getTitle(), loc.getDescription());
                    localizations++;
                    if (verdict.isPassed()) {
                        passed++;
                    } else {
                        refused++;
                        log.info("AUDIT refused {} [{}]: {}", video.getId(), entry.getKey(), verdict.getFailures());
                    }
                    languages.add(AuditResult.AuditLanguage.builder()
                            .language(entry.getKey())
                            .title(loc.getTitle())
                            .description(loc.getDescription())
                            .passed(verdict.isPassed())
                            .failures(verdict.getFailures())
                            .build());
                }
            }
            videos.add(AuditResult.AuditVideo.builder()
                    .videoId(video.getId())
                    .title(sourceTitle)
                    .thumbnailUrl(youtube.summary(video).getThumbnailUrl())
                    .defaultLanguage(defaultLanguage)
                    .languages(languages)
                    .build());
        }
        return AuditResult.builder()
                .checkedAt(Instant.now())
                .videosChecked(videos.size())
                .localizationsChecked(localizations)
                .passed(passed)
                .refused(refused)
                .quotaUsed(quota.used() - quotaBefore)
                .videos(videos)
                .build();
    }
}
