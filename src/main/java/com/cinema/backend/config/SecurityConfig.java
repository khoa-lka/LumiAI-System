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

            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                // 1. ADMIN
                .requestMatchers("/api/admin/**")
                .hasRole("ADMIN")

                // 2. POS — mở tạm để frontend hiện tại gọi được
                .requestMatchers("/api/pos/**")
                .permitAll()

                // 3. MANAGER
                .requestMatchers("/api/manager/**")
                .hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers("/api/dashboard/**")
                .hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers("/api/audit/**")
                .hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers("/api/vouchers/manager/**")
                .hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers("/api/promos/manager/**")
                .hasAnyRole("MANAGER", "ADMIN")

                // 4. MANAGER ghi dữ liệu
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/movies/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/movies/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/movies/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/showtimes/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/showtimes/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/showtimes/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/fnb/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/fnb/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/fnb/**"
                ).hasAnyRole("MANAGER", "ADMIN")

                // 5. Dữ liệu cá nhân
                .requestMatchers("/api/profile/**").authenticated()
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/bookings/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()

                // Không khai báo /api/pos/** lần thứ hai
                .anyRequest().permitAll()
            )

            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }
}