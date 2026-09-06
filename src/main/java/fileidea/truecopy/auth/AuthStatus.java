package fileidea.truecopy.auth;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuthStatus {
    boolean configured;
    boolean connected;
    String channelId;
    String channelTitle;
    String redirectUri;
    String message;
}
