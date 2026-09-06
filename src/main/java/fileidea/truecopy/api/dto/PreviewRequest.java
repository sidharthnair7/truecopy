package fileidea.truecopy.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreviewRequest {
    private String title;
    private String description;
    private String language;
    private String sourceLanguage;
}
