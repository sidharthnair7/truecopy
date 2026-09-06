package fileidea.truecopy.translate;

import fileidea.truecopy.protect.ProtectedTokens;

import java.util.Locale;

public final class TranslationPrompt {

    public static final String SYSTEM = """
            You localize YouTube video metadata for a creator. You translate a title and a description from the source language into the target language.
            Rules:
            - Keep every protected token exactly as written, byte for byte: URLs, timestamps such as 12:34 or 1:02:03, @handles, #hashtags and promo codes. Never translate, reorder, reformat or drop them.
            - Keep every line break of the description. Keep the first line short and strong; it is the only line shown before "Show more".
            - The title must be natural in the target language and at most 100 characters.
            - Adapt idioms for the target audience but keep the meaning, product names and brand names.
            - Output only a JSON object with two string fields: "title" and "description". No commentary.
            """;

    private TranslationPrompt() {
    }

    public static String user(String sourceLanguage, String targetLanguage, String title, String description, ProtectedTokens tokens) {
        StringBuilder sb = new StringBuilder();
        sb.append("Source language: ").append(languageName(sourceLanguage)).append('\n');
        sb.append("Target language: ").append(languageName(targetLanguage)).append('\n');
        sb.append("Protected tokens that must appear verbatim in the output:\n");
        if (tokens == null || tokens.isEmpty()) {
            sb.append("(none)\n");
        } else {
            tokens.all().forEach(t -> sb.append("- ").append(t).append('\n'));
        }
        sb.append("\nTITLE:\n").append(title == null ? "" : title);
        sb.append("\n\nDESCRIPTION:\n").append(description == null ? "" : description);
        return sb.toString();
    }

    public static String languageName(String code) {
        Locale locale = Locale.forLanguageTag(code);
        String name = locale.getDisplayLanguage(Locale.ENGLISH);
        return name == null || name.isBlank() ? code : name + " (" + code + ")";
    }
}
