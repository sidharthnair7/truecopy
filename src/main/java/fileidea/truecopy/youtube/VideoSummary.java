package fileidea.truecopy.youtube;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class VideoSummary {
    String id;
    String title;
    String publishedAt;
    String privacyStatus;
    String defaultLanguage;
    String defaultAudioLanguage;
    String thumbnailUrl;
    List<String> localizedLanguages;
}
