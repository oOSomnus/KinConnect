package com.github.KinConnect.controllers;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.auth.UserLoginDto;
import com.github.KinConnect.dto.auth.UserLoginResponse;
import com.github.KinConnect.dto.auth.UserRegisterDto;
import com.github.KinConnect.dto.auth.UserVerifyDto;
import com.github.KinConnect.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author yihangz
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Response> register(@RequestBody UserRegisterDto userRegisterDto) {
        try {
            // register the user and send the verification code
            userService.newUser(userRegisterDto.getEmail(), userRegisterDto.getUsername(), userRegisterDto.getPassword());
            return ResponseEntity.status(HttpStatus.CREATED).body(Response.builder().code(201).message("Registration successful").build());
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message("Registration failed").build());
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Response> verifyEmail(@RequestBody UserVerifyDto userVerifyDto) {
        try {
            userService.verifyUser(userVerifyDto.getEmail(), userVerifyDto.getCode());
            return ResponseEntity.status(HttpStatus.CREATED).body(Response.builder().code(201).message("Verification successful").build());

        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message(e.getMessage()).build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Response> verifyEmail(@RequestBody UserLoginDto userLoginDto) {
        try {
            String jwtToken = userService.login(userLoginDto.getEmail(), userLoginDto.getPassword());
            return ResponseEntity.status(HttpStatus.OK).body(Response.builder().code(200).message("Login successful").data(new UserLoginResponse(jwtToken)).build());
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message(e.getMessage()).build());
        }
    }
}
