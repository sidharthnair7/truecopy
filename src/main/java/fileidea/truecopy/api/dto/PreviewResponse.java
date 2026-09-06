package fileidea.truecopy.api.dto;

import fileidea.truecopy.gate.RuleFailure;
import fileidea.truecopy.protect.ProtectedTokens;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PreviewResponse {
    String language;
    String title;
    String description;
    boolean passed;
    List<RuleFailure> failures;
    ProtectedTokens protectedTokens;
    long translationMillis;
}
