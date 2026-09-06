package fileidea.truecopy.youtube;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ChannelSummary {
    String id;
    String title;
    String customUrl;
    String uploadsPlaylistId;
    Long videoCount;
    Long subscriberCount;
}
