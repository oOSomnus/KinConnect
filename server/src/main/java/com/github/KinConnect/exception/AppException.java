package com.github.KinConnect.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {
    private final int code;
    private final String logMsg;
    private final String displayMsg;

    public AppException(int code, String logMsg, String displayMsg) {
        super(logMsg);
        this.code = code;
        this.displayMsg = displayMsg;
        this.logMsg = logMsg;
    }
}
