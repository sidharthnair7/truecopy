package fileidea.truecopy.translate;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record TranslationOutput(
        @JsonPropertyDescription("The translated video title, at most 100 characters, with every protected token kept verbatim")
        String title,
        @JsonPropertyDescription("The translated video description with the original line breaks and every protected token kept verbatim")
        String description) {
}
