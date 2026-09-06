package fileidea.truecopy.protect;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenExtractorTest {

    private final TokenExtractor extractor = new TokenExtractor();

    @Test
    void extractsUrlsWithoutTrailingPunctuation() {
        ProtectedTokens tokens = extractor.extract("Visit https://example.com/a?b=c, or www.example.org.");
        assertEquals(Set.of("https://example.com/a?b=c", "www.example.org"), tokens.getUrls());
    }

    @Test
    void extractsTimestampsInBothForms() {
        ProtectedTokens tokens = extractor.extract("0:00 Intro 12:34 Middle 1:02:03 End 2024 not 99:99:99");
        assertTrue(tokens.getTimestamps().contains("0:00"));
        assertTrue(tokens.getTimestamps().contains("12:34"));
        assertTrue(tokens.getTimestamps().contains("1:02:03"));
        assertFalse(tokens.getTimestamps().contains("2024"));
    }

    @Test
    void handlesIgnoreEmailAddresses() {
        ProtectedTokens tokens = extractor.extract("Mail me at sid@example.com or find @sidnair on YouTube");
        assertEquals(Set.of("@sidnair"), tokens.getHandles());
    }

    @Test
    void hashtagsSupportUnicode() {
        ProtectedTokens tokens = extractor.extract("#TrueCopy #編集 #Édition and not a&#39;");
        assertEquals(Set.of("#TrueCopy", "#編集", "#Édition"), tokens.getHashtags());
    }

    @Test
    void promoCodesNeedLettersAndDigits() {
        ProtectedTokens tokens = extractor.extract("Use SAVE20 or TRUECOPY10, not FREE, not 2024, not 4K, not https://x.io/CODE99");
        assertEquals(Set.of("SAVE20", "TRUECOPY10"), tokens.getPromoCodes());
    }

    @Test
    void wellFormedTimestampsAreValidated() {
        assertTrue(extractor.isWellFormedTimestamp("12:34"));
        assertTrue(extractor.isWellFormedTimestamp("1:02:03"));
        assertFalse(extractor.isWellFormedTimestamp("12:60"));
        assertFalse(extractor.isWellFormedTimestamp("1:60:00"));
    }

    @Test
    void nullTextYieldsEmptyTokens() {
        assertTrue(extractor.extract(null).isEmpty());
    }
}
