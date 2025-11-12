package com.github.KinConnect.dto.user;

import java.time.LocalDateTime;

public record UserInfoSimpleDto(Long id,
                                String username,
                                String email,
                                Boolean checkedInToday,
                                LocalDateTime lastCheckInAt) {
}
    
