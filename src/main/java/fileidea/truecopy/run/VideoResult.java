package fileidea.truecopy.run;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoResult {
    private String videoId;
    private String sourceTitle;
    private String thumbnailUrl;
    private String defaultLanguage;
    private boolean defaultLanguageSet;
    @Builder.Default
    private List<LanguageResult> languages = new ArrayList<>();
    private long quotaUsed;
    private String error;
}
