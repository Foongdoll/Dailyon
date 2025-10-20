package com.foongdoll.backend.security;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    /**
     * HS256 시크릿(최소 256비트 권장). 운영에서는 32바이트 이상 랜덤 키 사용.
     */
    private String secret = "AKh`G]w>hs-jX,TdZ=E:~_{f='d7==/Yk^p{~P)?Emzzy`C*>~%]GxR4qP9+F@Q";
    private String issuer = "dailyon";
    private long accessTokenValiditySeconds = 60 * 30;       // 30m
    private long refreshTokenValiditySeconds = 60L * 60 * 24 * 14; // 14d
}
