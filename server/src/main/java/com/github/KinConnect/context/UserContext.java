package com.github.KinConnect.context;

import com.github.KinConnect.filters.JwtAuthenticationFilter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * @author yihangz
 */
public class UserContext {
    public static UserInfo getCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();

        if (principal instanceof JwtAuthenticationFilter.AuthenticatedUser user) {
            String userId = user.userId();
            String email = user.email();
            String username = user.username();
            return new UserInfo(userId, username, email);
        }
        return null;
    }

    public record UserInfo(String id, String name, String emails) {
    }
}
