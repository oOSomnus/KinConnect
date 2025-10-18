package com.github.KinConnect.controllers;

import com.github.KinConnect.context.UserContext;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.entities.User;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/switch-role")
    public ResponseEntity<Response> switchRole() {
        UserContext.UserInfo currentUserInfo = UserContext.getCurrentUserInfo();
        if (currentUserInfo == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        userService.switchRole(currentUserInfo.id());
        return ResponseEntity.status(201).body(Response.builder().code(201).build());
    }

    @GetMapping("/info")
    public ResponseEntity<Response> info() {
        UserContext.UserInfo currentUserInfo = UserContext.getCurrentUserInfo();
        if (currentUserInfo == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        Long id = currentUserInfo.id();
        User user = userService.getUser(id);

    }
}
