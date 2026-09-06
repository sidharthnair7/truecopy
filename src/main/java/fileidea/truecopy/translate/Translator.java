package fileidea.truecopy.translate;

import fileidea.truecopy.protect.ProtectedTokens;

public interface Translator {

    Translation translate(String sourceLanguage, String targetLanguage, String title, String description, ProtectedTokens tokens);

    String activeModel();
}
