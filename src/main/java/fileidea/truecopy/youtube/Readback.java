package fileidea.truecopy.youtube;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class Readback {
    String videoId;
    String hl;
    String title;
    String description;
}
