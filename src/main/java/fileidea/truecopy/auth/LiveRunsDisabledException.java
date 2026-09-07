package fileidea.truecopy.auth;

public class LiveRunsDisabledException extends RuntimeException {

    public LiveRunsDisabledException() {
        super("Live runs are disabled on this deployment. Dry runs, the gate playground and the run history are open; set ALLOW_LIVE_RUNS=true on the server to allow writes to YouTube.");
    }

    public LiveRunsDisabledException(String message) {
        super(message);
    }
}
