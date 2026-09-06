package fileidea.truecopy.api;

import fileidea.truecopy.api.dto.QuotaResponse;
import fileidea.truecopy.youtube.ChannelSummary;
import fileidea.truecopy.youtube.QuotaMeter;
import fileidea.truecopy.youtube.Readback;
import fileidea.truecopy.youtube.VideoDetail;
import fileidea.truecopy.youtube.VideoSummary;
import fileidea.truecopy.youtube.YouTubeClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChannelController {

    private final YouTubeClient youtube;
    private final QuotaMeter quota;

    @GetMapping("/channel")
    public ChannelSummary channel() {
        return youtube.channel();
    }

    @GetMapping("/videos")
    public List<VideoSummary> videos(@RequestParam(defaultValue = "25") int max) {
        return youtube.summaries(Math.max(1, Math.min(max, 200)));
    }

    @GetMapping("/videos/{id}")
    public VideoDetail video(@PathVariable String id) {
        return youtube.detail(youtube.video(id));
    }

    @GetMapping("/videos/{id}/readback")
    public Readback readback(@PathVariable String id, @RequestParam String hl) {
        if (hl == null || hl.isBlank()) {
            throw new IllegalArgumentException("hl is required, e.g. hl=es");
        }
        return youtube.readback(id, hl.strip().toLowerCase());
    }

    @GetMapping("/quota")
    public QuotaResponse quota() {
        return new QuotaResponse(quota.used(), quota.budget(), quota.remaining(), QuotaMeter.LIST, QuotaMeter.UPDATE);
    }
}
