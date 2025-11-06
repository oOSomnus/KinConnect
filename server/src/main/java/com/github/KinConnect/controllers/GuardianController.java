package com.github.KinConnect.controllers;

import com.github.KinConnect.context.UserContext;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.services.GuardianService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/guardian")
@RequiredArgsConstructor
public class GuardianController {

    private final GuardianService guardianService;

    @PostMapping("/add-olds")
    public ResponseEntity<Response> addOld(@Valid @RequestBody AddOldRequest request) {
        var user = UserContext.getCurrentUserInfo();
        if (user == null || user.id() == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        guardianService.addOld(user.id(), request.getOldId(), request.getOldEmail());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Response.builder().code(201).message("Binding success").data(null).build());
    }
}
