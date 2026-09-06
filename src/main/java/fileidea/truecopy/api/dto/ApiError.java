package fileidea.truecopy.api.dto;

import lombok.Value;

@Value
public class ApiError {
    int status;
    String error;
    String message;
}
