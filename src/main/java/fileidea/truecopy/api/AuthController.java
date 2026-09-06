package fileidea.truecopy.api;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import fileidea.truecopy.auth.AuthStatus;
import fileidea.truecopy.auth.GoogleAuthService;
import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.youtube.ChannelSummary;
import fileidea.truecopy.youtube.YouTubeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final GoogleAuthService auth;
    private final YouTubeClient youtube;
    private final TrueCopyProperties properties;

    @GetMapping("/status")
    public AuthStatus status() {
        String redirectUri = properties.getGoogle().getRedirectUri();
        if (!auth.isConfigured()) {
            return AuthStatus.builder()
                    .configured(false)
                    .connected(false)
                    .redirectUri(redirectUri)
                    .message("client_secret.json not found at " + properties.getGoogle().getClientSecretsPath())
                    .build();
        }
        if (!auth.isConnected()) {
            return AuthStatus.builder()
                    .configured(true)
                    .connected(false)
                    .redirectUri(redirectUri)
                    .message("Not connected. Open GET /api/auth/url and complete Google consent.")
                    .build();
        }
        try {
            ChannelSummary channel = youtube.channel();
            return AuthStatus.builder()
                    .configured(true)
                    .connected(true)
                    .channelId(channel.getId())
                    .channelTitle(channel.getTitle())
                    .redirectUri(redirectUri)
                    .build();
        } catch (Exception e) {
            String reason = e.getCause() instanceof GoogleJsonResponseException google
                    && google.getDetails() != null && google.getDetails().getMessage() != null
                    ? google.getDetails().getMessage()
                    : e.getMessage();
            log.warn("Stored credential could not reach YouTube: {}", reason);
            return AuthStatus.builder()
                    .configured(true)
                    .connected(false)
                    .redirectUri(redirectUri)
                    .message("YouTube rejected the request: " + reason)
                    .build();
        }
    }

    @GetMapping("/url")
    public Map<String, String> url() {
        return Map.of("url", auth.authorizationUrl());
    }

    @GetMapping("/callback")
    public ResponseEntity<String> callback(@RequestParam(required = false) String code,
                                           @RequestParam(required = false) String error) {
        String outcome;
        String reason = null;
        if (error != null || code == null) {
            outcome = "error";
            reason = error == null ? "missing_code" : error;
        } else {
            try {
                auth.exchange(code);
                outcome = "connected";
            } catch (Exception e) {
                log.error("OAuth exchange failed", e);
                outcome = "error";
                reason = e.getMessage();
            }
        }
        String frontend = properties.getFrontendUrl();
        if (frontend == null || frontend.isBlank()) {
            String body = "connected".equals(outcome)
                    ? "<html><body style=\"font-family:sans-serif;padding:2rem\"><h2>TrueCopy is connected to your YouTube channel.</h2><p>You can close this tab.</p></body></html>"
                    : "<html><body style=\"font-family:sans-serif;padding:2rem\"><h2>Connection failed.</h2><p>" + reason + "</p></body></html>";
            return ResponseEntity.status("connected".equals(outcome) ? HttpStatus.OK : HttpStatus.BAD_REQUEST)
                    .header("Content-Type", "text/html; charset=utf-8")
                    .body(body);
        }
        UriComponentsBuilder target = UriComponentsBuilder.fromUriString(frontend).queryParam("auth", outcome);
        if (reason != null) {
            target.queryParam("reason", reason);
        }
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(target.build().toUriString())).build();
    }

    @PostMapping("/disconnect")
    public Map<String, Boolean> disconnect() {
        auth.disconnect();
        return Map.of("connected", false);
    }
}
