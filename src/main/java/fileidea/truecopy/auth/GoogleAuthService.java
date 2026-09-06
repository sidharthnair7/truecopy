package fileidea.truecopy.auth;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.YouTubeScopes;
import fileidea.truecopy.config.TrueCopyProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.GeneralSecurityException;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class GoogleAuthService {

    private static final String USER_ID = "truecopy";
    private static final List<String> SCOPES = List.of(YouTubeScopes.YOUTUBE_FORCE_SSL);

    private final TrueCopyProperties properties;
    private final HttpTransport transport;
    private final JsonFactory jsonFactory = GsonFactory.getDefaultInstance();
    private volatile GoogleAuthorizationCodeFlow flow;

    public GoogleAuthService(TrueCopyProperties properties) {
        this.properties = properties;
        try {
            this.transport = GoogleNetHttpTransport.newTrustedTransport();
        } catch (GeneralSecurityException | IOException e) {
            throw new IllegalStateException("Could not initialise Google HTTP transport", e);
        }
    }

    public boolean isConfigured() {
        return Files.isRegularFile(Path.of(properties.getGoogle().getClientSecretsPath()));
    }

    public String authorizationUrl() {
        return flow().newAuthorizationUrl()
                .setRedirectUri(properties.getGoogle().getRedirectUri())
                .setAccessType("offline")
                .set("prompt", "consent")
                .build();
    }

    public void exchange(String code) {
        try {
            GoogleTokenResponse response = flow().newTokenRequest(code)
                    .setRedirectUri(properties.getGoogle().getRedirectUri())
                    .execute();
            flow().createAndStoreCredential(response, USER_ID);
            log.info("YouTube channel connected");
        } catch (IOException e) {
            throw new UncheckedIOException("Token exchange failed", e);
        }
    }

    public Optional<Credential> credential() {
        if (!isConfigured()) {
            return Optional.empty();
        }
        try {
            Credential credential = flow().loadCredential(USER_ID);
            if (credential == null) {
                return Optional.empty();
            }
            boolean usable = credential.getRefreshToken() != null
                    || (credential.getExpiresInSeconds() != null && credential.getExpiresInSeconds() > 60);
            return usable ? Optional.of(credential) : Optional.empty();
        } catch (IOException e) {
            throw new UncheckedIOException("Could not load stored credential", e);
        }
    }

    public boolean isConnected() {
        return credential().isPresent();
    }

    public void disconnect() {
        try {
            flow().getCredentialDataStore().delete(USER_ID);
            log.info("YouTube channel disconnected");
        } catch (IOException e) {
            throw new UncheckedIOException("Could not delete stored credential", e);
        }
    }

    public YouTube youtube() {
        Credential credential = credential().orElseThrow(NotConnectedException::new);
        return new YouTube.Builder(transport, jsonFactory, credential)
                .setApplicationName(properties.getGoogle().getApplicationName())
                .build();
    }

    private GoogleAuthorizationCodeFlow flow() {
        GoogleAuthorizationCodeFlow existing = flow;
        if (existing != null) {
            return existing;
        }
        synchronized (this) {
            if (flow == null) {
                flow = buildFlow();
            }
            return flow;
        }
    }

    private GoogleAuthorizationCodeFlow buildFlow() {
        Path secretsPath = Path.of(properties.getGoogle().getClientSecretsPath());
        if (!Files.isRegularFile(secretsPath)) {
            throw new IllegalStateException("Google OAuth client secrets not found at " + secretsPath.toAbsolutePath()
                    + ". Download the OAuth client JSON from Google Cloud Console and save it there.");
        }
        try (InputStreamReader reader = new InputStreamReader(Files.newInputStream(secretsPath), StandardCharsets.UTF_8)) {
            GoogleClientSecrets secrets = GoogleClientSecrets.load(jsonFactory, reader);
            File tokensDir = new File(properties.getGoogle().getTokensDir());
            return new GoogleAuthorizationCodeFlow.Builder(transport, jsonFactory, secrets, SCOPES)
                    .setDataStoreFactory(new FileDataStoreFactory(tokensDir))
                    .setAccessType("offline")
                    .build();
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read Google OAuth client secrets", e);
        }
    }
}
