package com.github.KinConnect.services;

import com.github.KinConnect.entities.User;
import com.github.KinConnect.repositories.UserRepository;
import com.github.KinConnect.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

/**
 * @author yihangz
 */
@RequiredArgsConstructor
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // return true if the given email exists
    public Boolean userExists(String email) {
        return userRepository.findByEmail(email) != null;
    }

    // create new unverified user
    public void newUser(String email, String username, String password) {
        try {
            String hashedPassword = passwordEncoder.encode(password);
            String code = CodeGenerator.generateCode();
            userRepository.save(User.builder().email(email).password(hashedPassword).username(username).code(code).build());

        } catch (Exception e) {
            throw new RuntimeException("Failed to create new user, email=" + email + ", username=" + username, e);
        }
    }

    // verify a user
    public boolean verifyUser(String email, String code) {
        User user = userRepository.findByEmail(email);
        if (user == null) {throw new NoSuchElementException("User not found");}
        if (user.getCode().equals(code)) {
            user.setIsVerified(true);
            userRepository.save(user);
            return true;
        } else {
            user.setIsVerified(false);
            throw new IllegalStateException("Code does not match or expired");
        }
    }

    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {throw new NoSuchElementException("User not found");}

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new IllegalStateException("Email has not been verified");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("邮箱/用户名或密码错误");
        }

        return jwtService.generateToken(Long.toString(user.getId()), user.getEmail(), user.getUsername());
    }
}
