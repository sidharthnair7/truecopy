package fileidea.truecopy.run;

import fileidea.truecopy.config.TrueCopyProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RunRepository {

    private final TrueCopyProperties properties;
    private final ObjectMapper mapper;
    private final Map<String, Run> runs = new ConcurrentHashMap<>();

    @PostConstruct
    void load() {
        Path dir = dir();
        try {
            Files.createDirectories(dir);
            try (Stream<Path> files = Files.list(dir)) {
                files.filter(p -> p.toString().endsWith(".json")).forEach(p -> {
                    try {
                        Run run = mapper.readValue(Files.readString(p), Run.class);
                        if (run.getStatus() == RunStatus.RUNNING || run.getStatus() == RunStatus.QUEUED) {
                            run.setStatus(RunStatus.FAILED);
                            run.setError("Interrupted by a server restart");
                        }
                        runs.put(run.getId(), run);
                    } catch (Exception e) {
                        log.warn("Skipping unreadable run file {}: {}", p, e.getMessage());
                    }
                });
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not initialise runs directory " + dir, e);
        }
        log.info("Loaded {} previous run(s) from {}", runs.size(), dir.toAbsolutePath());
    }

    public void save(Run run) {
        runs.put(run.getId(), run);
        Path target = dir().resolve(run.getId() + ".json");
        Path temp = dir().resolve(run.getId() + ".json.tmp");
        try {
            Files.writeString(temp, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(run));
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not persist run " + run.getId(), e);
        }
    }

    public Optional<Run> find(String id) {
        return Optional.ofNullable(runs.get(id));
    }

    public List<Run> all() {
        return runs.values().stream()
                .sorted(Comparator.comparing(Run::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private Path dir() {
        return Path.of(properties.getRunsDir());
    }
}
