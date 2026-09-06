package fileidea.truecopy.run;

import fileidea.truecopy.gate.RuleFailure;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;

@Value
@Builder
public class AuditResult {
    Instant checkedAt;
    int videosChecked;
    int localizationsChecked;
    int passed;
    int refused;
    long quotaUsed;
    List<AuditVideo> videos;

    @Value
    @Builder
    public static class AuditVideo {
        String videoId;
        String title;
        String thumbnailUrl;
        String defaultLanguage;
        List<AuditLanguage> languages;
    }

    @Value
    @Builder
    public static class AuditLanguage {
        String language;
        String title;
        String description;
        boolean passed;
        List<RuleFailure> failures;
    }
}
