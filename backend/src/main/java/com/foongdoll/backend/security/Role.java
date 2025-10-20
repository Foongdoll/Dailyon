package com.foongdoll.backend.security;

public enum Role {
    ADMIN, USER, GUEST;

    public String asAuthority() {
        return "ROLE_" + name();
    }
}
