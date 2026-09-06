package fileidea.truecopy.youtube;

import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.Channel;
import com.google.api.services.youtube.model.ChannelListResponse;
import com.google.api.services.youtube.model.PlaylistItem;
import com.google.api.services.youtube.model.PlaylistItemListResponse;
import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoListResponse;
import com.google.api.services.youtube.model.VideoLocalization;
import com.google.api.services.youtube.model.VideoSnippet;
import fileidea.truecopy.auth.GoogleAuthService;
import fileidea.truecopy.protect.TokenExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class YouTubeClient {

    private static final List<String> SNIPPET = List.of("snippet");
    private static final List<String> SNIPPET_LOCALIZATIONS_STATUS = List.of("snippet", "localizations", "status");
    private static final List<String> SNIPPET_LOCALIZATIONS = List.of("snippet", "localizations");

    private final GoogleAuthService auth;
    private final QuotaMeter quota;
    private final TokenExtractor tokenExtractor;

    public ChannelSummary channel() {
        try {
            ChannelListResponse response = auth.youtube().channels()
                    .list(List.of("snippet", "contentDetails", "statistics"))
                    .setMine(true)
                    .execute();
            quota.spend(QuotaMeter.LIST);
            if (response.getItems() == null || response.getItems().isEmpty()) {
                throw new IllegalStateException("The connected Google account has no YouTube channel");
            }
            Channel channel = response.getItems().getFirst();
            return ChannelSummary.builder()
                    .id(channel.getId())
                    .title(channel.getSnippet().getTitle())
                    .customUrl(channel.getSnippet().getCustomUrl())
                    .uploadsPlaylistId(channel.getContentDetails().getRelatedPlaylists().getUploads())
                    .videoCount(channel.getStatistics() == null || channel.getStatistics().getVideoCount() == null
                            ? null : channel.getStatistics().getVideoCount().longValue())
                    .subscriberCount(channel.getStatistics() == null || channel.getStatistics().getSubscriberCount() == null
                            ? null : channel.getStatistics().getSubscriberCount().longValue())
                    .build();
        } catch (IOException e) {
            throw new UncheckedIOException("channels.list failed", e);
        }
    }

    public List<String> uploadVideoIds(int max) {
        String playlistId = channel().getUploadsPlaylistId();
        List<String> ids = new ArrayList<>();
        String pageToken = null;
        try {
            do {
                PlaylistItemListResponse page = auth.youtube().playlistItems()
                        .list(List.of("contentDetails"))
                        .setPlaylistId(playlistId)
                        .setMaxResults(50L)
                        .setPageToken(pageToken)
                        .execute();
                quota.spend(QuotaMeter.LIST);
                if (page.getItems() != null) {
                    for (PlaylistItem item : page.getItems()) {
                        ids.add(item.getContentDetails().getVideoId());
                        if (ids.size() >= max) {
                            return ids;
                        }
                    }
                }
                pageToken = page.getNextPageToken();
            } while (pageToken != null);
        } catch (IOException e) {
            throw new UncheckedIOException("playlistItems.list failed", e);
        }
        return ids;
    }

    public List<Video> videos(List<String> ids) {
        List<Video> out = new ArrayList<>();
        try {
            for (int i = 0; i < ids.size(); i += 50) {
                List<String> chunk = ids.subList(i, Math.min(i + 50, ids.size()));
                VideoListResponse response = auth.youtube().videos()
                        .list(SNIPPET_LOCALIZATIONS_STATUS)
                        .setId(chunk)
                        .execute();
                quota.spend(QuotaMeter.LIST);
                if (response.getItems() != null) {
                    out.addAll(response.getItems());
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException("videos.list failed", e);
        }
        return out;
    }

    public Video video(String id) {
        List<Video> found = videos(List.of(id));
        if (found.isEmpty()) {
            throw new IllegalArgumentException("Video not found or not owned by the connected channel: " + id);
        }
        return found.getFirst();
    }

    public List<VideoSummary> summaries(int max) {
        List<String> ids = uploadVideoIds(max);
        if (ids.isEmpty()) {
            return List.of();
        }
        return videos(ids).stream().map(this::summary).toList();
    }

    public VideoSummary summary(Video video) {
        VideoSnippet snippet = video.getSnippet();
        return VideoSummary.builder()
                .id(video.getId())
                .title(snippet.getTitle())
                .publishedAt(snippet.getPublishedAt() == null ? null : snippet.getPublishedAt().toStringRfc3339())
                .privacyStatus(video.getStatus() == null ? null : video.getStatus().getPrivacyStatus())
                .defaultLanguage(snippet.getDefaultLanguage())
                .defaultAudioLanguage(snippet.getDefaultAudioLanguage())
                .thumbnailUrl(thumbnail(snippet))
                .localizedLanguages(video.getLocalizations() == null ? List.of() : List.copyOf(video.getLocalizations().keySet()))
                .build();
    }

    public VideoDetail detail(Video video) {
        VideoSnippet snippet = video.getSnippet();
        Map<String, VideoDetail.LocalizedText> localizations = new LinkedHashMap<>();
        if (video.getLocalizations() != null) {
            video.getLocalizations().forEach((lang, loc) -> localizations.put(lang, VideoDetail.LocalizedText.builder()
                    .title(loc.getTitle())
                    .description(loc.getDescription())
                    .build()));
        }
        String description = snippet.getDescription() == null ? "" : snippet.getDescription();
        return VideoDetail.builder()
                .id(video.getId())
                .title(snippet.getTitle())
                .description(description)
                .publishedAt(snippet.getPublishedAt() == null ? null : snippet.getPublishedAt().toStringRfc3339())
                .privacyStatus(video.getStatus() == null ? null : video.getStatus().getPrivacyStatus())
                .defaultLanguage(snippet.getDefaultLanguage())
                .defaultAudioLanguage(snippet.getDefaultAudioLanguage())
                .thumbnailUrl(thumbnail(snippet))
                .localizations(localizations)
                .protectedTokens(tokenExtractor.extract(snippet.getTitle() + "\n" + description))
                .build();
    }

    public Video publishLocalizations(Video video, Map<String, VideoLocalization> additions) {
        Map<String, VideoLocalization> merged = new LinkedHashMap<>();
        if (video.getLocalizations() != null) {
            merged.putAll(video.getLocalizations());
        }
        merged.putAll(additions);
        video.setLocalizations(merged);
        try {
            Video updated = auth.youtube().videos()
                    .update(SNIPPET_LOCALIZATIONS, video)
                    .execute();
            quota.spend(QuotaMeter.UPDATE);
            log.info("Published {} localization(s) to video {}", additions.size(), video.getId());
            return updated;
        } catch (IOException e) {
            throw new UncheckedIOException("videos.update failed", e);
        }
    }

    public Readback readback(String id, String hl) {
        try {
            VideoListResponse response = auth.youtube().videos()
                    .list(SNIPPET)
                    .setId(List.of(id))
                    .setHl(hl)
                    .execute();
            quota.spend(QuotaMeter.LIST);
            if (response.getItems() == null || response.getItems().isEmpty()) {
                throw new IllegalArgumentException("Video not found: " + id);
            }
            VideoSnippet snippet = response.getItems().getFirst().getSnippet();
            VideoLocalization localized = snippet.getLocalized();
            return Readback.builder()
                    .videoId(id)
                    .hl(hl)
                    .title(localized == null ? snippet.getTitle() : localized.getTitle())
                    .description(localized == null ? snippet.getDescription() : localized.getDescription())
                    .build();
        } catch (IOException e) {
            throw new UncheckedIOException("videos.list readback failed", e);
        }
    }

    private String thumbnail(VideoSnippet snippet) {
        if (snippet.getThumbnails() == null) {
            return null;
        }
        if (snippet.getThumbnails().getMedium() != null) {
            return snippet.getThumbnails().getMedium().getUrl();
        }
        if (snippet.getThumbnails().getDefault() != null) {
            return snippet.getThumbnails().getDefault().getUrl();
        }
        return null;
    }
}
