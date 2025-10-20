package com.foongdoll.backend.common.error;


import lombok.Getter;

@Getter
public class DailyonException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Object details; // Map<String,Object> or any serializable

    public DailyonException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
        this.details = null;
    }

    public DailyonException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.details = null;
    }

    public DailyonException(ErrorCode errorCode, String message, Object details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }

    public DailyonException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
        this.details = null;
    }
}