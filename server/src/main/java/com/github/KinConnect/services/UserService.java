package com.github.KinConnect.services;

import com.github.KinConnect.entities.User;
import com.github.KinConnect.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * @author yihangz
 */
@RequiredArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // return true if the given email exists
    public Boolean userExists(String email) {
        return userRepository.findByEmail(email) != null;
    }

    // create new unverified user
    public void newUser(String email, String username, String password) {
        try {
            String hashedPassword = passwordEncoder.encode(password);
            userRepository.save(User.builder().email(email).password(hashedPassword).username(username).build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to create new user, email=" + email + ", username=" + username, e);
        }
    }
}
