package fileidea.truecopy.run;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Run {
    private String id;
    private RunStatus status;
    private boolean dryRun;
    private String sourceLanguage;
    private List<String> languages;
    private Instant createdAt;
    private Instant startedAt;
    private Instant finishedAt;
    private int videosRequested;
    private int videosProcessed;
    private int attempted;
    private int published;
    private int refused;
    private int failed;
    private int skipped;
    private long quotaUsed;
    private long quotaBudget;
    private String error;
    private String currentVideoId;
    private String currentVideoTitle;
    private String currentLanguage;
    private int languagesDone;
    private int languagesTotal;
    @Builder.Default
    private List<VideoResult> videos = new ArrayList<>();
}
