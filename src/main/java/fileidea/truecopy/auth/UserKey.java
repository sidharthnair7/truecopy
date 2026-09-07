package fileidea.truecopy.auth;

public final class UserKey {

    public static final String COOKIE = "tc_session";
    public static final String DEMO = "truecopy";

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private UserKey() {
    }

    public static void set(String key) {
        CURRENT.set(key);
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static String current() {
        String key = CURRENT.get();
        if (key == null) {
            throw new IllegalStateException("No session key bound to this thread");
        }
        return key;
    }
}
