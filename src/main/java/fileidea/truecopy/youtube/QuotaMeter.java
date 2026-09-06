package fileidea.truecopy.youtube;

import fileidea.truecopy.config.TrueCopyProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
@RequiredArgsConstructor
public class QuotaMeter {

    public static final long LIST = 1;
    public static final long UPDATE = 50;

    private final TrueCopyProperties properties;
    private final AtomicLong used = new AtomicLong();

    public long used() {
        return used.get();
    }

    public long budget() {
        return properties.getQuotaBudget();
    }

    public long remaining() {
        return budget() - used();
    }

    public boolean canSpend(long units) {
        return used() + units <= budget();
    }

    public void spend(long units) {
        used.addAndGet(units);
    }
}
