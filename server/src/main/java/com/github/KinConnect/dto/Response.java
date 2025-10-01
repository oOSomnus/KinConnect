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
}
