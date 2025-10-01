package com.github.KinConnect.controllers;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author yihangz
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Response> register(@RequestParam String email, String username, String password) {
        try {
            //1. verify email not exists
            if (authService.userExists(email)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Response.builder().code(409).message("Registration failed: user already exists").build());
            }
            //2. register the user and send the verification code
            authService.newUser(email, username, password);
            return ResponseEntity.status(HttpStatus.CREATED).body(Response.builder().code(201).message("Registration successful").build());
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message("Registration failed").build());
        }
    }
}
