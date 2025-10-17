package com.github.KinConnect.controllers;

import com.github.KinConnect.context.UserContext;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.entities.Message;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.services.MessageService;
import com.github.KinConnect.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MsgController {

    private final UserService userService;
    private final MessageService messageService;

    @PostMapping("/update/{old_id}")
    public ResponseEntity<Response> getMessage(
            @PathVariable("old_id") Long oldId
    ) {
        try {
            UserContext.UserInfo currentUserInfo = UserContext.getCurrentUserInfo();
            if (currentUserInfo == null) {
                throw new AppException(400, "current userinfo is null", "user not logged in");
            }
            if (Boolean.FALSE.equals(userService.verifyRelation(oldId, currentUserInfo.id()))) {
                throw new AppException(400, "relation verification failed", "user not logged in");
            }
            List<Message> messages = messageService.getAllMessages(oldId);

            return ResponseEntity.status(HttpStatus.OK)
                    .body(Response.builder()
                            .code(200)
                            .message("Registration successful for client " + oldId)
                            .data(messages)
                            .build());
        } catch (AppException e) {
            System.out.println(e.getLogMsg());
            return ResponseEntity.status(e.getCode())
                    .body(Response.builder()
                            .code(400)
                            .message(e.getDisplayMsg())
                            .build());
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Response.unknownError());
        }
    }
}
