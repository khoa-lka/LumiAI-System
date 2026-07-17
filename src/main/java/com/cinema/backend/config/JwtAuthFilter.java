package com.cinema.backend.config;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                Claims claims = jwtUtil.parse(token);
                Integer roleId = claims.get("roleId", Integer.class);
                String accountId = claims.getSubject();

                String role = switch (roleId == null ? -1 : roleId) {
                    case 1 -> "ROLE_MANAGER";
                    case 2 -> "ROLE_STAFF";
                    case 3 -> "ROLE_CUSTOMER";
                    case 4 -> "ROLE_ADMIN";
                    default -> "ROLE_UNKNOWN";
                };

                var auth = new UsernamePasswordAuthenticationToken(
                        accountId, null,
                        List.of(new SimpleGrantedAuthority(role)));

                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                // Token sai hoặc hết hạn → coi như chưa đăng nhập
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }
}