package fileidea.truecopy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "truecopy.runs-dir=target/test-runs",
        "truecopy.google.tokens-dir=target/test-tokens",
        "truecopy.google.client-secrets-path=target/missing-client-secret.json"
})
class TruecopyApplicationTests {

    @Test
    void contextLoads() {
    }

}
