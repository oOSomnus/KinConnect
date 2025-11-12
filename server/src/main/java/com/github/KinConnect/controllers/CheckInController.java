package com.github.KinConnect.controllers;

import com.github.KinConnect.context.UserContext;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.checkin.CheckInStatusDto;
import com.github.KinConnect.entities.User;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/checkin")
@RequiredArgsConstructor
public class CheckInController {

    private final UserService userService;

    @GetMapping("/status")
    public ResponseEntity<Response> status() {
        UserContext.UserInfo currentUser = UserContext.getCurrentUserInfo();
        if (currentUser == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        User user = userService.getUser(currentUser.id());
        boolean hasGuardian = user.getGuardian() != null;
        boolean checkedInToday = userService.hasCheckedInToday(user);
        CheckInStatusDto dto = new CheckInStatusDto(
                hasGuardian,
                checkedInToday,
                user.getLastCheckInAt(),
                userService.toSimpleDto(user.getGuardian())
        );
        return ResponseEntity.ok(Response.builder().code(200).data(dto).build());
    }

    @PostMapping("/confirm")
    public ResponseEntity<Response> confirm() {
        UserContext.UserInfo currentUser = UserContext.getCurrentUserInfo();
        if (currentUser == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        userService.confirmCheckIn(currentUser.id());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Response.builder().code(201).message("Check-in confirmed").build());
    }
}
