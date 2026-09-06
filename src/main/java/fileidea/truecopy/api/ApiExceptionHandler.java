package fileidea.truecopy.api;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import fileidea.truecopy.api.dto.ApiError;
import fileidea.truecopy.auth.LiveRunsDisabledException;
import fileidea.truecopy.auth.NotConnectedException;
import fileidea.truecopy.translate.TranslationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.UncheckedIOException;

@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NotConnectedException.class)
    public ResponseEntity<ApiError> notConnected(NotConnectedException e) {
        return body(HttpStatus.UNAUTHORIZED, e.getMessage());
    }

    @ExceptionHandler(LiveRunsDisabledException.class)
    public ResponseEntity<ApiError> liveDisabled(LiveRunsDisabledException e) {
        return body(HttpStatus.FORBIDDEN, e.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> notFound(NoResourceFoundException e) {
        return body(HttpStatus.NOT_FOUND, "No such endpoint: " + e.getResourcePath());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException e) {
        return body(HttpStatus.BAD_REQUEST, "Malformed request body: " + e.getMostSpecificCause().getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> badRequest(IllegalArgumentException e) {
        return body(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiError> conflict(IllegalStateException e) {
        return body(HttpStatus.CONFLICT, e.getMessage());
    }

    @ExceptionHandler(TranslationException.class)
    public ResponseEntity<ApiError> translation(TranslationException e) {
        return body(HttpStatus.BAD_GATEWAY, e.getMessage());
    }

    @ExceptionHandler(UncheckedIOException.class)
    public ResponseEntity<ApiError> io(UncheckedIOException e) {
        if (e.getCause() instanceof GoogleJsonResponseException google) {
            String message = google.getDetails() == null || google.getDetails().getMessage() == null
                    ? google.getMessage()
                    : google.getDetails().getMessage();
            HttpStatus status = HttpStatus.resolve(google.getStatusCode());
            return body(status == null ? HttpStatus.BAD_GATEWAY : status, "YouTube API: " + message);
        }
        log.error("I/O failure", e);
        return body(HttpStatus.BAD_GATEWAY, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unexpected(Exception e) {
        log.error("Unhandled error", e);
        return body(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage());
    }

    private ResponseEntity<ApiError> body(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiError(status.value(), status.getReasonPhrase(), message));
    }
}
