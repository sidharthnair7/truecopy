package fileidea.truecopy.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RunRequest {
    private List<String> videoIds;
    private List<String> languages;
    private String sourceLanguage;
    private Integer maxVideos;
    private boolean dryRun;
}
