package com.cinema.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// BỔ SUNG: @EnableScheduling bắt buộc phải có thì các job @Scheduled (tự động
// tắt Voucher/Promotion hết hạn lúc 00:00 mỗi đêm) mới thực sự chạy được.
// Thiếu annotation này thì code vẫn biên dịch bình thường nhưng job sẽ không
// bao giờ được kích hoạt (không báo lỗi gì cả, chỉ lặng lẽ không chạy).
@EnableScheduling
@SpringBootApplication
public class BackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
