package fileidea.truecopy.auth;

public class NotConnectedException extends RuntimeException {

    public NotConnectedException() {
        super("No YouTube channel connected. Call GET /api/auth/url and complete the Google consent flow.");
    }
}
