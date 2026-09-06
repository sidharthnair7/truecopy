package fileidea.truecopy.gate;

import fileidea.truecopy.protect.TokenExtractor;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GateTest {

    private static final String TITLE = "How I Edit Videos 10x Faster";
    private static final String DESCRIPTION = """
            Get the preset pack here: https://example.com/presets?ref=yt
            Use code SAVE20 for 20% off.

            0:00 Intro
            2:15 The workflow
            12:34 Colour grading

            Follow me @sidnair and use #TrueCopy #Editing
            """;

    private final Gate gate = new Gate(new TokenExtractor());

    @Test
    void faithfulTranslationPasses() {
        String title = "Cómo edito vídeos 10 veces más rápido";
        String description = """
                Consigue el pack de presets aquí: https://example.com/presets?ref=yt
                Usa el código SAVE20 para un 20% de descuento.

                0:00 Introducción
                2:15 El flujo de trabajo
                12:34 Etalonaje

                Sígueme en @sidnair y usa #TrueCopy #Editing
                """;
        GateResult result = gate.check(TITLE, DESCRIPTION, title, description);
        assertTrue(result.isPassed(), result.getFailures().toString());
        assertTrue(result.getFailures().isEmpty());
    }

    @Test
    void rewrittenUrlIsRefused() {
        String description = DESCRIPTION.replace("https://example.com/presets?ref=yt", "https://example.com/es/presets?ref=yt");
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.URLS), rules(result));
        assertTrue(result.getFailures().getFirst().getDetail().contains("https://example.com/presets?ref=yt"));
    }

    @Test
    void timestampTurnedIntoProseIsRefused() {
        String description = DESCRIPTION.replace("12:34 Colour grading", "doce minutos treinta y cuatro: etalonaje");
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.TIMESTAMPS), rules(result));
    }

    @Test
    void translatedHandleIsRefused() {
        String description = DESCRIPTION.replace("@sidnair", "@sidnair_es");
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.HANDLES), rules(result));
    }

    @Test
    void droppedHashtagIsRefused() {
        String description = DESCRIPTION.replace("#Editing", "");
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.HASHTAGS), rules(result));
    }

    @Test
    void changedPromoCodeIsRefused() {
        String description = DESCRIPTION.replace("SAVE20", "AHORRA20");
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.PROMO_CODES), rules(result));
    }

    @Test
    void overlongTitleIsRefused() {
        String title = "x".repeat(101);
        GateResult result = gate.check(TITLE, DESCRIPTION, title, DESCRIPTION);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.TITLE_LENGTH), rules(result));
    }

    @Test
    void emptyTitleIsRefused() {
        GateResult result = gate.check(TITLE, DESCRIPTION, "   ", DESCRIPTION);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.TITLE_LENGTH), rules(result));
    }

    @Test
    void overlongDescriptionIsRefused() {
        String description = DESCRIPTION + "y".repeat(5000);
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.DESCRIPTION_LENGTH), rules(result));
    }

    @Test
    void multipleFailuresAreAllNamed() {
        String description = DESCRIPTION
                .replace("https://example.com/presets?ref=yt", "https://ejemplo.com")
                .replace("@sidnair", "@sid");
        GateResult result = gate.check(TITLE, DESCRIPTION, "Título", description);
        assertFalse(result.isPassed());
        assertEquals(List.of(Rule.URLS, Rule.HANDLES), rules(result));
    }

    @Test
    void urlOrderDoesNotMatter() {
        String source = "A https://a.example B https://b.example";
        String translated = "B https://b.example A https://a.example";
        assertTrue(gate.check("T", source, "T", translated).isPassed());
    }

    private List<Rule> rules(GateResult result) {
        return result.getFailures().stream().map(RuleFailure::getRule).distinct().toList();
    }
}
