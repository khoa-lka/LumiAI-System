package com.cinema.backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // Khóa bí mật để ký token (tối thiểu 32 ký tự). Sau này nên đưa ra biến môi trường.
    private static final String SECRET =
            "las-cinema-secret-key-doi-thanh-cua-rieng-ban-cho-du-32-ky-tu";

    private static final long EXPIRE_MS = 24L * 60 * 60 * 1000; // token sống 24 giờ

    private SecretKey key() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    // Tạo token, nhét sẵn accountId + roleId vào trong
    public String generateToken(Integer accountId, Integer roleId) {
        return Jwts.builder()
                .subject(String.valueOf(accountId))
                .claim("roleId", roleId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRE_MS))
                .signWith(key())
                .compact();
    }

    // Đọc & kiểm tra token (chữ ký sai / hết hạn sẽ tự ném exception)
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}