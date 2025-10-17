package com.github.KinConnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * @author yihangz
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Response {
    private Integer code;
    private String message;
    private Object data;

    /**
     * @return unknown unhandled unknown error
     */
    public static Response unknownError() {
        return Response.builder().code(500).message("unknown error").build();
    }
}
