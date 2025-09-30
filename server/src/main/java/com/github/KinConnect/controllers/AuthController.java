package com.github.KinConnect.controllers;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.services.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public Response register(@RequestParam String email, String username, String password) {
        try {
            //1. verify email not exists
            if (authService.userExists(email)) {
                return Response.builder().code(400).message("Registration failed: user already exists").build();
            }
            //2. register the user and send the verification code
            authService.newUser(email, username, password);
            return Response.builder().code(200).message("Registration successful").build();
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return Response.builder().code(400).message("Registration failed").build();
        }
    }
}
