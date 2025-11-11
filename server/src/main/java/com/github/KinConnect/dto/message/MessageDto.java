package com.github.KinConnect.dto.message;

public record MessageDto(
        String id,
        String text,
        String execTime,
        Boolean isOneTime
) {
}
