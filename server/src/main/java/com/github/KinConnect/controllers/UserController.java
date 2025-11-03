package com.github.KinConnect.controllers;

import com.github.KinConnect.context.UserContext;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.user.UserInfoDto;
import com.github.KinConnect.dto.user.UserInfoSimpleDto;
import com.github.KinConnect.entities.User;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

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
        
        // Handle guardian - only create DTO if guardian is not null
        UserInfoSimpleDto guardianResult = null;
        User guardian = user.getGuardian();
        if (guardian != null) {
            guardianResult = new UserInfoSimpleDto(guardian.getId(), guardian.getUsername(), guardian.getEmail());
        }
        
        // Handle olds - only create DTOs if olds list is not null and not empty
        List<UserInfoSimpleDto> oldsResult = new ArrayList<>();
        List<User> olds = user.getOlds();
        if (olds != null && !olds.isEmpty()) {
            for (User old : olds) {
                oldsResult.add(new UserInfoSimpleDto(old.getId(), old.getUsername(), old.getEmail()));
            }
        }
        
        UserInfoDto response = new UserInfoDto(
            id, 
            user.getUsername(), 
            user.getEmail(), 
            user.getIsOld(), 
            guardianResult, 
            oldsResult, 
            user.getIsVerified()
        );
        return ResponseEntity.status(200).body(Response.builder().code(200).data(response).build());
    }
}
