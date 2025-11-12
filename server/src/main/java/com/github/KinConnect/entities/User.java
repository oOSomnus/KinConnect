package com.github.KinConnect.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * @author yihangz
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_email", columnList = "email"),
        @Index(name = "idx_guardian_id", columnList = "guardian_id"),
        @Index(name = "idx_user_guardian", columnList = "id, guardian_id")
})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String username;
    @Column(unique = true, nullable = false)
    private String email;
    @Column(nullable = false)
    private String password;
    @Builder.Default
    private Boolean isOld = false;
    @ManyToOne
    @JoinColumn(name = "guardian_id")
    private User guardian;
    @Builder.Default
    @OneToMany(mappedBy = "guardian")
    private List<User> olds = new ArrayList<>();
    @Builder.Default
    private Boolean isVerified = false;
    private String code;
    @Column(name = "code_expiration")
    private LocalDateTime codeExpiration;
    @Column(name = "last_check_in_at")
    private LocalDateTime lastCheckInAt;

    public User(Long id) {
        this.id = id;
    }
}
