package fileidea.truecopy.api;

import fileidea.truecopy.api.dto.ConfigResponse;
import fileidea.truecopy.auth.GoogleAuthService;
import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.translate.Translator;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {

    private final TrueCopyProperties properties;
    private final GoogleAuthService auth;
    private final Translator translator;

    @GetMapping
    public ConfigResponse config() {
        String provider = properties.getLlm().getProvider();
        boolean anthropic = "anthropic".equalsIgnoreCase(provider);
        String key = anthropic ? properties.getAnthropic().getApiKey() : properties.getGemini().getApiKey();
        List<String> models = anthropic ? List.of(properties.getAnthropic().getModel()) : properties.getGemini().getModels();
        return ConfigResponse.builder()
                .llmProvider(provider)
                .llmModel(translator.activeModel())
                .llmModels(models)
                .llmKeyPresent(key != null && !key.isBlank())
                .googleClientSecretPresent(auth.isConfigured())
                .liveRunsAllowed(properties.isAllowLiveRuns())
                .sourceLanguage(properties.getSourceLanguage())
                .defaultLanguages(properties.getLanguages())
                .quotaBudget(properties.getQuotaBudget())
                .redirectUri(properties.getGoogle().getRedirectUri())
                .frontendUrl(properties.getFrontendUrl())
                .build();
    }
}
