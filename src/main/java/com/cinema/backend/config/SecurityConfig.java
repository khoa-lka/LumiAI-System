package com.cinema.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ===== 1. ADMIN: chỉ quản trị viên =====
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // ===== 2. STAFF (máy POS bán vé tại quầy) =====
                .requestMatchers("/api/pos/**").hasAnyRole("STAFF", "MANAGER", "ADMIN")

                // ===== 3. MANAGER: dashboard, đối soát, quản lý voucher/khuyến mãi =====
                .requestMatchers("/api/manager/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/dashboard/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/audit/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/vouchers/manager/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/promos/manager/**").hasAnyRole("MANAGER", "ADMIN")

                // ===== 4. MANAGER: thao tác GHI phim/suất chiếu/đồ ăn (GET vẫn public) =====
                .requestMatchers(HttpMethod.POST,   "/api/movies/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/movies/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/movies/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/showtimes/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/showtimes/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/showtimes/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST,   "/api/fnb/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/fnb/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/fnb/**").hasAnyRole("MANAGER", "ADMIN")

                // ===== 5. Cần ĐĂNG NHẬP (bất kỳ role nào): dữ liệu cá nhân =====
                .requestMatchers("/api/profile/**").authenticated()
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/bookings/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()

                // ===== 6. Còn lại (trang chủ, xem phim, login, đặt vé, thanh toán...) mở =====
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}