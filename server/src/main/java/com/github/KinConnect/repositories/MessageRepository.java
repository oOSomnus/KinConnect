package com.github.KinConnect.repositories;

import com.github.KinConnect.entities.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByReceiver_Id(Long receiverId);
}
