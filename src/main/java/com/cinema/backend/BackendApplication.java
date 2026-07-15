package com.cinema.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;                                  // 👈 THÊM
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;             // 👈 THÊM
import org.springframework.security.crypto.password.PasswordEncoder;                 // 👈 THÊM

@EnableScheduling
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	// 👇 THÊM KHỐI NÀY: khai báo PasswordEncoder cho cả app dùng chung
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}