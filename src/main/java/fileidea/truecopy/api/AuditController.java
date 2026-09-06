package fileidea.truecopy.api;

import fileidea.truecopy.api.dto.AuditRequest;
import fileidea.truecopy.run.AuditResult;
import fileidea.truecopy.run.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService audit;

    @PostMapping
    public AuditResult run(@RequestBody(required = false) AuditRequest request) {
        return audit.audit(request == null ? new AuditRequest() : request);
    }
}
