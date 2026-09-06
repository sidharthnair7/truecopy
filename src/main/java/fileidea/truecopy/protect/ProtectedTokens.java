package fileidea.truecopy.protect;

import lombok.Builder;
import lombok.Value;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Value
@Builder
public class ProtectedTokens {
    Set<String> urls;
    Set<String> timestamps;
    Set<String> handles;
    Set<String> hashtags;
    Set<String> promoCodes;

    public List<String> all() {
        List<String> all = new ArrayList<>();
        all.addAll(urls);
        all.addAll(timestamps);
        all.addAll(handles);
        all.addAll(hashtags);
        all.addAll(promoCodes);
        return all;
    }

    public boolean isEmpty() {
        return urls.isEmpty() && timestamps.isEmpty() && handles.isEmpty() && hashtags.isEmpty() && promoCodes.isEmpty();
    }
}
