package com.foongdoll.backend.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private T data;
    private ErrorBody error;
    private String traceId;

    public static <T> ApiResponse<T> ok(T data, String traceId) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .traceId(traceId)
                .build();
    }

    public static ApiResponse<Void> ok(String traceId) {
        return ApiResponse.<Void>builder()
                .success(true)
                .traceId(traceId)
                .build();
    }

    public static ApiResponse<Void> fail(ErrorBody error, String traceId) {
        return ApiResponse.<Void>builder()
                .success(false)
                .error(error)
                .traceId(traceId)
                .build();
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ErrorBody {
        private String code;     // ex) "VALIDATION_ERROR"
        private String message;  // human-readable
        private Integer status;  // HTTP status
        private Object details;  // map/list(optional)
    }
}