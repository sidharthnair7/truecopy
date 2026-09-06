package fileidea.truecopy.gate;

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
public class GateResult {
    private boolean passed;
    @Builder.Default
    private List<RuleFailure> failures = new ArrayList<>();

    public static GateResult pass() {
        return GateResult.builder().passed(true).build();
    }

    public static GateResult fail(List<RuleFailure> failures) {
        return GateResult.builder().passed(false).failures(failures).build();
    }
}
