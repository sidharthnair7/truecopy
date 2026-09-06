package fileidea.truecopy.run;

import fileidea.truecopy.gate.RuleFailure;
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
public class LanguageResult {
    private String language;
    private LanguageOutcome outcome;
    private String title;
    private String description;
    @Builder.Default
    private List<RuleFailure> failures = new ArrayList<>();
    private String readbackTitle;
    private Boolean readbackMatched;
    private String error;
    private long translationMillis;
}
