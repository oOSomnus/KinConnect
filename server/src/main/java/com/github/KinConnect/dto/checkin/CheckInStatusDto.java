package com.github.KinConnect.dto.checkin;

import com.github.KinConnect.dto.user.UserInfoSimpleDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckInStatusDto {
    private Boolean hasGuardian;
    private Boolean checkedInToday;
    private LocalDateTime lastCheckInAt;
    private UserInfoSimpleDto guardian;
}
