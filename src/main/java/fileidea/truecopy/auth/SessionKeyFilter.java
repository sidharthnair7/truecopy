package fileidea.truecopy.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class SessionKeyFilter extends OncePerRequestFilter {

    private static final int ONE_YEAR = 60 * 60 * 24 * 365;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = existing(request);
        if (key == null) {
            key = "u-" + UUID.randomUUID().toString().replace("-", "");
            Cookie cookie = new Cookie(UserKey.COOKIE, key);
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(ONE_YEAR);
            cookie.setSecure(request.isSecure());
            cookie.setAttribute("SameSite", "Lax");
            response.addCookie(cookie);
        }
        UserKey.set(key);
        try {
            chain.doFilter(request, response);
        } finally {
            UserKey.clear();
        }
    }

    private String existing(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (UserKey.COOKIE.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
