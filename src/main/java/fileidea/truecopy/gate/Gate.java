package fileidea.truecopy.gate;

import fileidea.truecopy.protect.ProtectedTokens;
import fileidea.truecopy.protect.TokenExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class Gate {

    public static final int MAX_TITLE_LENGTH = 100;
    public static final int MAX_DESCRIPTION_LENGTH = 5000;

    private final TokenExtractor extractor;

    public GateResult check(String sourceTitle, String sourceDescription, String translatedTitle, String translatedDescription) {
        String source = join(sourceTitle, sourceDescription);
        String translated = join(translatedTitle, translatedDescription);
        ProtectedTokens expected = extractor.extract(source);
        ProtectedTokens actual = extractor.extract(translated);
        List<RuleFailure> failures = new ArrayList<>();

        compare(Rule.URLS, expected.getUrls(), actual.getUrls(), failures);
        compare(Rule.TIMESTAMPS, expected.getTimestamps(), actual.getTimestamps(), failures);
        for (String ts : actual.getTimestamps()) {
            if (!extractor.isWellFormedTimestamp(ts)) {
                failures.add(new RuleFailure(Rule.TIMESTAMPS, "malformed timestamp in translation: " + ts));
            }
        }
        compare(Rule.HANDLES, expected.getHandles(), actual.getHandles(), failures);
        compare(Rule.HASHTAGS, expected.getHashtags(), actual.getHashtags(), failures);
        compare(Rule.PROMO_CODES, expected.getPromoCodes(), actual.getPromoCodes(), failures);

        String title = translatedTitle == null ? "" : translatedTitle.strip();
        if (title.isEmpty()) {
            failures.add(new RuleFailure(Rule.TITLE_LENGTH, "translated title is empty"));
        } else if (title.length() > MAX_TITLE_LENGTH) {
            failures.add(new RuleFailure(Rule.TITLE_LENGTH, "translated title is " + title.length() + " characters; YouTube allows " + MAX_TITLE_LENGTH));
        }
        int descriptionLength = translatedDescription == null ? 0 : translatedDescription.length();
        if (descriptionLength > MAX_DESCRIPTION_LENGTH) {
            failures.add(new RuleFailure(Rule.DESCRIPTION_LENGTH, "translated description is " + descriptionLength + " characters; YouTube allows " + MAX_DESCRIPTION_LENGTH));
        }

        return failures.isEmpty() ? GateResult.pass() : GateResult.fail(failures);
    }

    private void compare(Rule rule, Set<String> expected, Set<String> actual, List<RuleFailure> failures) {
        Set<String> missing = new LinkedHashSet<>(expected);
        missing.removeAll(actual);
        Set<String> unexpected = new LinkedHashSet<>(actual);
        unexpected.removeAll(expected);
        if (missing.isEmpty() && unexpected.isEmpty()) {
            return;
        }
        StringBuilder detail = new StringBuilder();
        if (!missing.isEmpty()) {
            detail.append("missing from translation: ").append(missing);
        }
        if (!unexpected.isEmpty()) {
            if (!detail.isEmpty()) {
                detail.append("; ");
            }
            detail.append("not in source: ").append(unexpected);
        }
        failures.add(new RuleFailure(rule, detail.toString()));
    }

    private String join(String title, String description) {
        return (title == null ? "" : title) + "\n" + (description == null ? "" : description);
    }
}
