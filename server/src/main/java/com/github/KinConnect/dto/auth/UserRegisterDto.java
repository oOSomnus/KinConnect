package com.github.KinConnect.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRegisterDto {
    @NotBlank(message = "username should not be empty")
    @Size(min = 3, max = 20, message = "length of username should in range of 3-20 characters")
    private String username;

    @NotBlank(message = "email should not be empty")
    @Email(message = "not valid email")
    private String email;

    @NotBlank(message = "password should not be empty")
    @Size(min = 8, max = 20, message = "password length should in range of 8-20 characters")
    private String password;
}
