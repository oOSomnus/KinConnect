package com.github.KinConnect.controllers;

import com.github.KinConnect.context.UserContext;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.message.MessageDto;
import com.github.KinConnect.dto.message.MessageUpdateDto;
import com.github.KinConnect.entities.Message;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.services.MessageService;
import com.github.KinConnect.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MsgController {

    private final UserService userService;
    private final MessageService messageService;

    @GetMapping("/{old_id}")
    public ResponseEntity<Response> getMessage(
            @PathVariable("old_id") Long oldId
    ) {
        UserContext.UserInfo currentUserInfo = UserContext.getCurrentUserInfo();
        if (currentUserInfo == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        if (Boolean.FALSE.equals(userService.verifyRelation(oldId, currentUserInfo.id()))) {
            throw new AppException(400, "relation verification failed", "user not logged in");
        }
        List<Message> messages = messageService.getAllMessages(oldId);
        List<MessageDto> dtoList = messages.stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.OK)
                .body(Response.builder()
                        .code(200)
                        .message("Registration successful for client " + oldId)
                        .data(dtoList)
                        .build());

    }


    @PostMapping("/update/{old_id}")
    public ResponseEntity<Response> updateMessages(
            @PathVariable("old_id") Long oldId,
            @Valid @RequestBody List<MessageUpdateDto> messageList) {

        UserContext.UserInfo user = UserContext.getCurrentUserInfo();
        if (user == null) {
            throw new AppException(400, "current userinfo is null", "user not logged in");
        }
        Long operatorUserId = user.id();
        messageService.updateOld(oldId, user.id(), messageList, operatorUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Response.builder().code(201).message("ok").build());
    }


    private MessageDto toDto(Message message) {
        return new MessageDto(
                message.getId(),
                message.getText(),
                message.getExecTime(),
                message.getIsOneTime()
        );
    }
}
