package com.github.KinConnect.services;

import com.github.KinConnect.entities.User;
import com.github.KinConnect.repositories.UserRepository;
import com.github.KinConnect.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final MailService mailService;


    // create new unverified user
    @Transactional
    public void newUser(String email, String username, String password) {
        try {
            User user = userRepository.findByEmail(email);
            if (user != null && user.getIsVerified()) {
                throw new RuntimeException("User already verified");
            }
            String hashedPassword = passwordEncoder.encode(password);
            String code = CodeGenerator.generateCode();
            mailService.sendHtmlMail(email, "Your KinConnect Code", getCodeHtml(code));
            if (user != null) {
                userRepository.save(User.builder().id(user.getId()).email(email).password(hashedPassword).username(username).code(code).build());
            } else {
                userRepository.save(User.builder().email(email).password(hashedPassword).username(username).code(code).build());
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
            throw new RuntimeException("Failed to create new user, email=" + email + ", username=" + username, e);
        }
    }

    // verify a user
    public void verifyUser(String email, String code) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new NoSuchElementException("User not found");
        }
        if (user.getCode().equals(code)) {
            user.setIsVerified(true);
            userRepository.save(user);
            return;
        }
        throw new IllegalStateException("Code does not match or expired");
    }

    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new NoSuchElementException("User not found");
        }

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new IllegalStateException("Email has not been verified");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("Wrong password");
        }

        return jwtService.generateToken(Long.toString(user.getId()), user.getEmail(), user.getUsername());
    }

    private String getCodeHtml(String code) {
        return String.format("""
                <html>
                  <body>
                    <h2 style="color: #2e86de;">Welcome to KinConnect!</h2>
                    <p>Your verification code is: <b style="color:red;">%s</b></p>
                    <p>Please verify within 10 minutes.</p>
                    <hr/>
                    <small>This email is sent automatically, please don't respond.</small>
                  </body>
                </html>
                """, code);
    }

}
