package com.github.KinConnect.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserVerifyDto {
    @NotNull(message = "code should not be empty")
    @Size(min = 6, max = 6, message = "code length should be 6")
    private String code;

    @NotBlank(message = "email should not be empty")
    @Email(message = "not valid email")
    private String email;
}
