package com.github.KinConnect.dto.message;

/**
 * Lightweight view returned to clients when listing reminder messages.
 */
public record MessageDto(
        String id,
        String text,
        String execTime,
        Boolean isOneTime
) {
}
