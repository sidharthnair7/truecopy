package fileidea.truecopy.api.dto;

import fileidea.truecopy.gate.RuleFailure;
import fileidea.truecopy.protect.ProtectedTokens;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class GateCheckResponse {
    boolean passed;
    List<RuleFailure> failures;
    ProtectedTokens sourceTokens;
    ProtectedTokens translatedTokens;
}
