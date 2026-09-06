package fileidea.truecopy.api;

import fileidea.truecopy.api.dto.GateCheckRequest;
import fileidea.truecopy.api.dto.GateCheckResponse;
import fileidea.truecopy.api.dto.TextRequest;
import fileidea.truecopy.gate.Gate;
import fileidea.truecopy.gate.GateResult;
import fileidea.truecopy.protect.ProtectedTokens;
import fileidea.truecopy.protect.TokenExtractor;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gate")
@RequiredArgsConstructor
public class GateController {

    private final Gate gate;
    private final TokenExtractor extractor;

    @PostMapping("/check")
    public GateCheckResponse check(@RequestBody GateCheckRequest request) {
        GateResult result = gate.check(request.getSourceTitle(), request.getSourceDescription(),
                request.getTranslatedTitle(), request.getTranslatedDescription());
        return GateCheckResponse.builder()
                .passed(result.isPassed())
                .failures(result.getFailures())
                .sourceTokens(extractor.extract(join(request.getSourceTitle(), request.getSourceDescription())))
                .translatedTokens(extractor.extract(join(request.getTranslatedTitle(), request.getTranslatedDescription())))
                .build();
    }

    @PostMapping("/tokens")
    public ProtectedTokens tokens(@RequestBody TextRequest request) {
        return extractor.extract(request.getText());
    }

    private String join(String title, String description) {
        return (title == null ? "" : title) + "\n" + (description == null ? "" : description);
    }
}
