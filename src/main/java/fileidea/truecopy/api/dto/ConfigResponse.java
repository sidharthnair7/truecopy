package fileidea.truecopy.api.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ConfigResponse {
    String llmProvider;
    String llmModel;
    List<String> llmModels;
    boolean llmKeyPresent;
    boolean googleClientSecretPresent;
    String sourceLanguage;
    List<String> defaultLanguages;
    long quotaBudget;
    String redirectUri;
    String frontendUrl;
}
