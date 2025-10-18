package com.github.KinConnect.services;

import com.github.KinConnect.entities.User;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.repositories.UserRepository;
import com.github.KinConnect.utils.CodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

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

    private final Integer CODE_EXPIRATION_MIN = 10;

    // create new unverified user
    @Transactional
    public void newUser(String email, String username, String password) {
        try {
            User user = userRepository.findByEmail(email);
            if (user != null && user.getIsVerified()) {
                throw new AppException(409, "User already verified", "User already verified " + " email: " + email);
            }
            String hashedPassword = passwordEncoder.encode(password);
            String code = CodeGenerator.generateCode();
            mailService.sendHtmlMail(email, "Your KinConnect Code", getCodeHtml(code));
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MIN);
            if (user != null) {
                userRepository.save(User.builder().id(user.getId()).codeExpiration(expiresAt).email(email).password(hashedPassword).username(username).code(code).build());
            } else {
                userRepository.save(User.builder().codeExpiration(expiresAt).email(email).password(hashedPassword).username(username).code(code).build());
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(400, "Failed to create new user, email=" + email + ", username=" + username + e.getMessage(), "Failed to create new user");
        }
    }

    // verify a user
    @Transactional
    public void verifyUser(String email, String code) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException(404, "User not found, email: " + email, "User not found");
        }
        if (user.getCode().equals(code) && user.getCodeExpiration() != null && user.getCodeExpiration().isAfter(LocalDateTime.now())) {
            user.setIsVerified(true);
            userRepository.save(user);
            return;
        }
        throw new AppException(400, "Failed to verify user", "Failed to verify user, email: " + email);
    }

    /**
     * verified user login
     *
     * @param email
     * @param rawPassword
     * @return token
     */
    public String login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new AppException(404, "User not found", "User not found");
        }

        if (Boolean.FALSE.equals(user.getIsVerified())) {
            throw new AppException(403, "Email has not been verified, email: " + email, "Email has not been verified");
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new AppException(401, "Wrong password or email", "Wrong password or email");
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

    /**
     * Switch user role
     *
     * @param id userId
     */
    public void switchRole(long id) {
        try {
            Optional<User> userOptional = userRepository.findById(id);
            if (userOptional.isEmpty()) {
                throw new AppException(404, "User not found, Id: " + id, "User not found");
            }
            User user = userOptional.get();
            user.setIsOld(!user.getIsOld());
            userRepository.save(user);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(400, "Failed to create new user, id=" + id + e.getMessage(), "Failed to create new user");
        }
    }

    /**
     * verify guardian has old in their list
     *
     * @param oldId      oldId
     * @param guardianId guardianId
     */
    public boolean verifyRelation(Long oldId, Long guardianId) {
        try {
            return userRepository.existsByIdAndGuardian_Id(oldId, guardianId);
        } catch (Exception e) {
            throw new AppException(400, "Failed to verify user, old id=" + oldId.toString() + ", guardian id=" + guardianId.toString() + e.getMessage(), "Failed to verify user");
        }
    }

    /**
     * get user by id
     *
     * @param id
     * @return user
     */
    public User getUser(Long id) {
        try {
            Optional<User> user = userRepository.findById(id);
            if (user.isEmpty()) {
                throw new AppException(400, "User not found, Id: " + id, "User not found");
            }
            return user.get();
        } catch (Exception e) {
            throw new AppException(400, "Failed to get user, id=" + id.toString(), "Failed to get user");
        }
    }
}
