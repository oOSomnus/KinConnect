package com.github.KinConnect.dto.user;

import java.util.List;

public record UserInfoDto(Long id, String username, String email, Boolean isOld,
                          UserInfoSimpleDto guardian,
                          List<UserInfoSimpleDto> olds, Boolean isVerified) {
}

