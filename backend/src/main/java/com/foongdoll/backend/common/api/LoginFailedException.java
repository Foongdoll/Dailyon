package com.foongdoll.backend.common.api;

public class LoginFailedException extends org.springframework.security.core.AuthenticationException {
    public LoginFailedException(String msg) { super(msg); }
}
