package com.cinema.backend.controllers;

import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*") // Mở cổng CORS cho Front-End của Vy gọi vào thoải mái
public class ProfileController {

    @Autowired
    private AccountRepository accountRepository;

    // 1. API LẤY THÔNG TIN HỒ SƠ CHI TIẾT (Dùng khi F5 hoặc chuyển Tab Thành Viên)
    @GetMapping("/{id}")
    public ResponseEntity<?> getProfileDetails(@PathVariable("id") Integer accountId) {
        Optional<Account> accountOpt = accountRepository.findById(accountId);
        
        if (accountOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of(
                "status", "error",
                "message", "Không tìm thấy thông tin tài khoản người dùng này!"
            ));
        }

        Account account = accountOpt.get();
        String roleString = account.getRoleId() == 1 ? "MANAGER / ADMIN" : "MEMBER";

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "data", Map.of(
                "accountId", account.getAccountId(),
                "fullName", account.getFullname(),
                "email", account.getEmail(),
                "phone", account.getPhone(),
                "dateOfBirth", account.getDateOfBirth().toString(), // Trả về phom 'YYYY-MM-DD'
                "roleId", account.getRoleId(),
                "roleName", roleString
            )
        ));
    }

    // 2. API CẬP NHẬT CHỈNH SỬA THÔNG TIN HỒ SƠ (Nối trực tiếp vào nút LƯU THÔNG TIN)
    @PutMapping("/update")
    public ResponseEntity<?> updateProfileInformation(@RequestBody Map<String, Object> updateRequest) {
        try {
            if (updateRequest.get("accountId") == null) {
                return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Thiếu ID tài khoản định danh!"));
            }

            Integer accountId = Integer.parseInt(updateRequest.get("accountId").toString());
            String fullname = (String) updateRequest.get("fullName");
            String email = (String) updateRequest.get("email");
            String phone = (String) updateRequest.get("phone");
            String dobStr = (String) updateRequest.get("dateOfBirth"); // Nhận dạng chuỗi 'YYYY-MM-DD' hoặc 'DD/MM/YYYY'

            // Sục tìm tài khoản gốc trong Database ra để sửa
            Optional<Account> accountOpt = accountRepository.findById(accountId);
            if (accountOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("status", "error", "message", "Tài khoản không tồn tại trên hệ thống!"));
            }

            Account account = accountOpt.get();

            // Ràng buộc bảo mật 1: Check trùng Email với các tài khoản KHÁC trong DB
            if (email != null && !email.isBlank()) {
                if (accountRepository.existsByEmailAndAccountIdNot(email, accountId)) {
                    return ResponseEntity.badRequest().body(Map.of("status", "fail", "message", "Địa chỉ Email mới này đã có người khác sử dụng!"));
                }
                account.setEmail(email);
            }

            // Ràng buộc bảo mật 2: Check trùng Số điện thoại với các tài khoản KHÁC trong DB
            if (phone != null && !phone.isBlank()) {
                if (accountRepository.existsByPhoneAndAccountIdNot(phone, accountId)) {
                    return ResponseEntity.badRequest().body(Map.of("status", "fail", "message", "Số điện thoại mới này đã có người đăng ký!"));
                }
                account.setPhone(phone);
            }

            // Cập nhật các trường thông tin còn lại
            if (fullname != null && !fullname.isBlank()) {
                account.setFullname(fullname);
            }

            if (dobStr != null && !dobStr.isBlank()) {
                // Hỗ trợ parse cả phom Việt Nam 'DD/MM/YYYY' từ ô input readonly của em sang 'YYYY-MM-DD' chuẩn Java
                if (dobStr.contains("/")) {
                    String[] parts = dobStr.split("/");
                    account.setDateOfBirth(LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0])));
                } else {
                    account.setDateOfBirth(LocalDate.parse(dobStr));
                }
            }

            account.setUpdatedDate(LocalDateTime.now()); // Ghi nhận mốc thời gian chỉnh sửa mới nhất
            accountRepository.save(account); // Lưu đè xuống SQL Server

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Cập nhật hồ sơ thông tin tài khoản thành công!",
                "data", Map.of(
                    "fullName", account.getFullname(),
                    "phone", account.getPhone(),
                    "email", account.getEmail()
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "error",
                "message", "Lỗi xử lý lưu hồ sơ: " + e.getMessage()
            ));
        }
    }
}