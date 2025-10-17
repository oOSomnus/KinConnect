package com.github.KinConnect.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "messages", indexes = {
        @Index(name = "idx_sender", columnList = "sender_id"),
        @Index(name = "idx_receiver", columnList = "receiver_id")
})
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * Cron expression defining when the message should be executed.
     * Example: "0 0 9 * * ?" => Every day at 9:00 AM
     */
    @Column(name = "exec_time", nullable = false)
    private String execTime;

    /**
     * The text content of the message.
     */
    @Column(nullable = false, length = 500)
    private String text;

    /**
     * Whether the message should be sent only once or repeatedly.
     */
    @Column(name = "is_one_time", nullable = false)
    private Boolean isOneTime;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;
}

