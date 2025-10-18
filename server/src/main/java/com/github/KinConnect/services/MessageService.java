package com.github.KinConnect.services;

import com.github.KinConnect.dto.message.MessageUpdateDto;
import com.github.KinConnect.entities.Message;
import com.github.KinConnect.entities.User;
import com.github.KinConnect.exception.AppException;
import com.github.KinConnect.repositories.MessageRepository;
import com.github.KinConnect.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public List<Message> getAllMessages(Long oldId) {
        try {
            return messageRepository.findByReceiver_Id(oldId);
        } catch (Exception e) {
            throw new AppException(400, "error finding messages by receiver id " + e.getMessage(), "error finding messages");
        }
    }

    /**
     * Adult 提交 oldId 的完整消息列表：新增/更新/删除（不在清单中的视为删除）
     */
    @Transactional
    public void updateOld(Long oldId, Long senderId, List<MessageUpdateDto> incoming, Long operatorUserId) {
        // 1) 权限：operator 必须是 oldId 的 guardian
        User oldUser = userRepository.findById(oldId)
                .orElseThrow(() -> new IllegalArgumentException("old user not found: " + oldId));
        if (oldUser.getGuardian() == null || !Objects.equals(oldUser.getGuardian().getId(), operatorUserId)) {
            throw new AppException(400, "guardian not exists or not match when upadte old", "no permission: not guardian of this old user");
        }

        // 2) 数据校验（cron 合法性）
        for (MessageUpdateDto it : incoming) {
            if (!CronExpression.isValidExpression(it.getExecTime())) {
                throw new AppException(400, "invalid cron expression: " + it.getExecTime(), "invalid t");
            }
        }

        // 3) 查当前库
        List<Message> existing = messageRepository.findByReceiver_IdAndSender_Id(oldId, senderId);
        Map<String, Message> existMap = existing.stream()
                .collect(Collectors.toMap(Message::getId, m -> m));

        Set<String> keepIds = new HashSet<>();

        // 4) 新增/更新
        for (MessageUpdateDto it : incoming) {
            if (it.getId() == null) {
                Message m = Message.builder()
                        .id(oldId.toString())
                        .text(it.getText())
                        .execTime(it.getExecTime())
                        .deleted(false)
                        .sender(new User(senderId))
                        .build();
                messageRepository.save(m);
            } else {
                Message m = existMap.get(it.getId());
                if (m == null || !Objects.equals(m.getReceiver().getId(), oldId)) {
                    throw new AppException(400, "message not found or mismatch: id=" + it.getId(), "invalid message");
                }
                m.setText(it.getText());
                m.setExecTime(it.getExecTime());
                m.setIsOneTime(it.getIsOneTime());
                m.setDeleted(false);
                keepIds.add(m.getId());
            }
        }

        // 5) 删除（软删：不在 incoming 的都置 deleted=true）
        for (Message m : existing) {
            if (!keepIds.contains(m.getId())
                    && incoming.stream().noneMatch(i -> Objects.equals(i.getId(), m.getId()))) {
                m.setDeleted(true);
            }
        }
        // @Transactional 结束自动 flush
    }

}
