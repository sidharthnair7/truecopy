package fileidea.truecopy.protect;

import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class TokenExtractor {

    private static final Pattern URL = Pattern.compile("(?i)\\b(?:https?://|www\\.)[^\\s<>\"')\\]]+");
    private static final Pattern TIMESTAMP = Pattern.compile("(?<![\\d:])(?:\\d{1,2}:)?\\d{1,2}:\\d{2}(?![\\d:])");
    private static final Pattern HANDLE = Pattern.compile("(?<![\\w.])@[A-Za-z0-9_.\\-]{3,30}");
    private static final Pattern HASHTAG = Pattern.compile("(?<![\\w&])#[\\p{L}\\p{N}_]+");
    private static final Pattern PROMO_CODE = Pattern.compile("\\b(?=[A-Z0-9]{4,20}\\b)(?=[A-Z0-9]*\\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]+\\b");
    private static final String TRAILING_PUNCTUATION = ".,;:!?";

    public ProtectedTokens extract(String text) {
        String safe = text == null ? "" : text;
        return ProtectedTokens.builder()
                .urls(urls(safe))
                .timestamps(find(TIMESTAMP, safe))
                .handles(find(HANDLE, safe))
                .hashtags(find(HASHTAG, safe))
                .promoCodes(promoCodes(safe))
                .build();
    }

    public boolean isWellFormedTimestamp(String token) {
        String[] parts = token.split(":");
        try {
            int seconds = Integer.parseInt(parts[parts.length - 1]);
            if (seconds > 59) {
                return false;
            }
            if (parts.length == 3) {
                int minutes = Integer.parseInt(parts[1]);
                return minutes <= 59;
            }
            return parts.length == 2;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private Set<String> urls(String text) {
        Set<String> out = new LinkedHashSet<>();
        Matcher m = URL.matcher(text);
        while (m.find()) {
            String url = m.group();
            while (!url.isEmpty() && TRAILING_PUNCTUATION.indexOf(url.charAt(url.length() - 1)) >= 0) {
                url = url.substring(0, url.length() - 1);
            }
            out.add(url);
        }
        return out;
    }

    private Set<String> promoCodes(String text) {
        String withoutUrls = URL.matcher(text).replaceAll(" ");
        return find(PROMO_CODE, withoutUrls);
    }

    private Set<String> find(Pattern pattern, String text) {
        Set<String> out = new LinkedHashSet<>();
        Matcher m = pattern.matcher(text);
        while (m.find()) {
            out.add(m.group());
        }
        return out;
    }
}
