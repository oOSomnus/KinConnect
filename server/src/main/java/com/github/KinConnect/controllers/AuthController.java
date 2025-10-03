package com.github.KinConnect.controllers;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.UserLoginDto;
import com.github.KinConnect.dto.UserRegisterDto;
import com.github.KinConnect.dto.UserVerifyDto;
import com.github.KinConnect.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.NoSuchElementException;

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
            //1. verify email not exists
            if (userService.userExists(userRegisterDto.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Response.builder().code(409).message("Registration failed: user already exists").build());
            }
            //2. register the user and send the verification code
            userService.newUser(userRegisterDto.getEmail(), userRegisterDto.getUsername(), userRegisterDto.getPassword());
            // TODO: 3. send email w/ code
            return ResponseEntity.status(HttpStatus.CREATED).body(Response.builder().code(201).message("Registration successful").build());
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message("Registration failed").build());
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<Response> verifyEmail(@RequestBody UserVerifyDto userVerifyDto) {
        try {
            if (userService.verifyUser(userVerifyDto.getEmail(),userVerifyDto.getCode())) {
                return ResponseEntity.status(HttpStatus.CREATED).body(Response.builder().code(201).message("Verification successful").build());
            }
        } catch (NoSuchElementException e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(404).message("Email not found").build());
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message("Code does not match or expired").build());
        }
        catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message("Verification failed").build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Response> verifyEmail(@RequestBody UserLoginDto userLoginDto) {
        try {
            String jwtToken = userService.login(userLoginDto.getEmail(), userLoginDto.getPassword());
            

        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Response.builder().code(400).message("Login failed").build());
        }
    }
}
