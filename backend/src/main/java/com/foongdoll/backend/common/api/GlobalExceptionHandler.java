package com.foongdoll.backend.common.api;

import com.foongdoll.backend.common.error.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.http.*;
import org.springframework.web.ErrorResponse;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private String traceId() {
        // MDC에 없으면 null 리턴. (필요하면 생성해서 넣는 전략도 가능)
        return MDC.get("traceId");
    }

    private ResponseEntity<ApiResponse<Void>> build(ErrorCode code, String message, Object details) {
        var body = ApiResponse.ErrorBody.builder()
                .code(code.getCode())
                .message(message != null ? message : code.getDefaultMessage())
                .status(code.getHttpStatus().value())
                .details(details)
                .build();
        return ResponseEntity.status(code.getHttpStatus())
                .body(ApiResponse.fail(body, traceId()));
    }

    // 1) 스프링 6.1+ 기본 에러 추상화: ErrorResponse / ErrorResponseException
    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<ApiResponse<Void>> handleErrorResponse(
            ErrorResponseException e, HttpServletRequest req) {

        HttpStatus status = asHttpStatus(e);
        ErrorCode code = mapToErrorCode(status);

        var details = ApiErrorDetails.of(req, e.getBody() != null ? e.getBody().getDetail() : null);
        return build(code, e.getMessage(), details);
    }

    // 2) 정적 리소스/핸들러 미존재(404) — 과거 설정 없이도 여기로 옴
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(
            NoResourceFoundException e, HttpServletRequest req) {
        var details = ApiErrorDetails.of(req, e.getResourcePath());
        return build(ErrorCode.NOT_FOUND, "Endpoint not found", details);
    }

    // 3) 타입 미스매치(쿼리/패스 파라미터 캐스팅 실패)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException e, HttpServletRequest req) {
        var details = ApiErrorDetails.of(req,
                "requiredType=" + (e.getRequiredType() != null ? e.getRequiredType().getSimpleName() : "unknown")
                        + ", value=" + e.getValue());
        return build(ErrorCode.BAD_REQUEST, "Type mismatch: " + e.getName(), details);
    }

    // --- 유틸: 상태코드→ErrorCode 매핑 & 상태 추출 ---
    private static HttpStatus asHttpStatus(ErrorResponse er) {
        var sc = er.getStatusCode();
        return (sc instanceof HttpStatus hs) ? hs : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private static ErrorCode mapToErrorCode(HttpStatus status) {
        return switch (status) {
            case BAD_REQUEST -> ErrorCode.BAD_REQUEST;
            case UNAUTHORIZED -> ErrorCode.UNAUTHORIZED;
            case FORBIDDEN -> ErrorCode.FORBIDDEN;
            case NOT_FOUND -> ErrorCode.NOT_FOUND;
            case CONFLICT -> ErrorCode.CONFLICT;
            case PAYLOAD_TOO_LARGE -> ErrorCode.PAYLOAD_TOO_LARGE;
            case UNSUPPORTED_MEDIA_TYPE -> ErrorCode.UNSUPPORTED_MEDIA_TYPE;
            default -> ErrorCode.INTERNAL_ERROR;
        };
    }

    // --- 에러 세부 정보 payload (선택) ---
    static final class ApiErrorDetails {
        static Object of(HttpServletRequest req, String hint) {
            return java.util.Map.of(
                    "path", req.getRequestURI(),
                    "method", req.getMethod(),
                    "hint", hint
            );
        }
    }
}
