package fileidea.truecopy.youtube;

import fileidea.truecopy.protect.ProtectedTokens;
import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class VideoDetail {
    String id;
    String title;
    String description;
    String publishedAt;
    String privacyStatus;
    String defaultLanguage;
    String defaultAudioLanguage;
    String thumbnailUrl;
    Map<String, LocalizedText> localizations;
    ProtectedTokens protectedTokens;

    @Value
    @Builder
    public static class LocalizedText {
        String title;
        String description;
    }
}
