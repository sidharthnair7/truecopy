package fileidea.truecopy.api;

import fileidea.truecopy.api.dto.PreviewRequest;
import fileidea.truecopy.api.dto.PreviewResponse;
import fileidea.truecopy.config.TrueCopyProperties;
import fileidea.truecopy.gate.Gate;
import fileidea.truecopy.gate.GateResult;
import fileidea.truecopy.protect.ProtectedTokens;
import fileidea.truecopy.protect.TokenExtractor;
import fileidea.truecopy.translate.Translation;
import fileidea.truecopy.translate.Translator;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/translate")
@RequiredArgsConstructor
public class TranslateController {

    private final Translator translator;
    private final TokenExtractor extractor;
    private final Gate gate;
    private final TrueCopyProperties properties;

    @PostMapping("/preview")
    public PreviewResponse preview(@RequestBody PreviewRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (request.getLanguage() == null || request.getLanguage().isBlank()) {
            throw new IllegalArgumentException("language is required, e.g. es");
        }
        String language = request.getLanguage().strip().toLowerCase();
        String source = request.getSourceLanguage() == null || request.getSourceLanguage().isBlank()
                ? properties.getSourceLanguage()
                : request.getSourceLanguage().strip().toLowerCase();
        String description = request.getDescription() == null ? "" : request.getDescription();
        ProtectedTokens tokens = extractor.extract(request.getTitle() + "\n" + description);

        long started = System.currentTimeMillis();
        Translation translation = translator.translate(source, language, request.getTitle(), description, tokens);
        long elapsed = System.currentTimeMillis() - started;
        GateResult verdict = gate.check(request.getTitle(), description, translation.getTitle(), translation.getDescription());

        return PreviewResponse.builder()
                .language(language)
                .title(translation.getTitle())
                .description(translation.getDescription())
                .passed(verdict.isPassed())
                .failures(verdict.getFailures())
                .protectedTokens(tokens)
                .translationMillis(elapsed)
                .build();
    }
}
