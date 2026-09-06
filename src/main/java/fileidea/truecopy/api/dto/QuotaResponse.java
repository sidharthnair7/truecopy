package fileidea.truecopy.api.dto;

import lombok.Value;

@Value
public class QuotaResponse {
    long used;
    long budget;
    long remaining;
    long listCost;
    long updateCost;
}
