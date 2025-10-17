package com.github.KinConnect.services;

import com.github.KinConnect.entities.Message;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.repositories.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;

    public List<Message> getAllMessages(Long oldId) {
        try {
            List<Message> messages = messageRepository.findByReceiver_Id(oldId);
            return messages;
        } catch (Exception e) {
            throw new AppException(400, "error finding messages by receiver id " + e.getMessage(), "error finding messages");
        }
    }
}
