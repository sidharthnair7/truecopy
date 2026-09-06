package fileidea.truecopy.api;

import fileidea.truecopy.api.dto.RunRequest;
import fileidea.truecopy.run.Run;
import fileidea.truecopy.run.RunService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/runs")
@RequiredArgsConstructor
public class RunController {

    private final RunService runs;

    @PostMapping
    public ResponseEntity<Run> start(@RequestBody(required = false) RunRequest request) {
        Run run = runs.start(request == null ? new RunRequest() : request);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(run);
    }

    @GetMapping
    public List<Run> all() {
        return runs.all();
    }

    @GetMapping("/{id}")
    public Run get(@PathVariable String id) {
        return runs.get(id);
    }
}
