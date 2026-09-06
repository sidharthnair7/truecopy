package fileidea.truecopy.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GateCheckRequest {
    private String sourceTitle;
    private String sourceDescription;
    private String translatedTitle;
    private String translatedDescription;
}
