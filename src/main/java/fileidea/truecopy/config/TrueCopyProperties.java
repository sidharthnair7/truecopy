package fileidea.truecopy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Data
@ConfigurationProperties(prefix = "truecopy")
public class TrueCopyProperties {

    private String frontendUrl = "";
    private List<String> corsOrigins = List.of("http://localhost:5173");
    private String runsDir = "./runs";
    private String sourceLanguage = "en";
    private List<String> languages = List.of("es", "fr", "ja");
    private long quotaBudget = 10_000;
    private Google google = new Google();
    private Llm llm = new Llm();
    private Gemini gemini = new Gemini();
    private Anthropic anthropic = new Anthropic();

    @Data
    public static class Google {
        private String clientSecretsPath = "./client_secret.json";
        private String tokensDir = "./tokens";
        private String redirectUri = "http://localhost:8080/api/auth/callback";
        private String applicationName = "TrueCopy";
    }

    @Data
    public static class Llm {
        private String provider = "gemini";
    }

    @Data
    public static class Gemini {
        private String apiKey = "";
        private List<String> models = List.of("gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-3.8-flash");
        private String baseUrl = "https://generativelanguage.googleapis.com";
        private int requestsPerMinute = 4;
    }

    @Data
    public static class Anthropic {
        private String model = "claude-opus-5";
        private String apiKey = "";
    }
}
