package com.github.KinConnect.repositories;

import com.github.KinConnect.entities.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByReceiver_Id(Long receiverId);

    List<Message> findByReceiver_IdAndDeleted(Long receiverId, Boolean isDeleted);

    List<Message> findByReceiver_IdAndSender_Id(Long receiverId, Long senderId);

    List<Message> findByReceiver_IdAndSender_IdAndDeleted(Long receiverId, Long senderId, Boolean isDeleted);
}
