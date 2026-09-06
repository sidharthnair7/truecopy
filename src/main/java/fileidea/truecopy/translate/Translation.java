package fileidea.truecopy.translate;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class Translation {
    String language;
    String title;
    String description;
}
