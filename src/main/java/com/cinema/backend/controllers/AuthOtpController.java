package com.cinema.backend.controllers;

import com.cinema.backend.dto.ResetPasswordRequest;
import com.cinema.backend.dto.SendOtpRequest;
import com.cinema.backend.dto.VerifyOtpRequest;
import com.cinema.backend.entities.Account;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.service.OtpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
public class AuthOtpController {

    @Autowired
    private OtpService otpService;

    @Autowired
    private AccountRepository accountRepository;

    @PostMapping("/send-register-otp")
    public Map<String, Object> sendRegisterOtp(@RequestBody SendOtpRequest request) {
        otpService.sendOtp(request.getEmail(), "REGISTER");

        return Map.of(
                "success", true,
                "message", "Đã gửi OTP đăng ký tới email " + request.getEmail()
        );
    }

    @PostMapping("/verify-register-otp")
    public Map<String, Object> verifyRegisterOtp(@RequestBody VerifyOtpRequest request) {
        otpService.verifyOtp(
                request.getEmail(),
                request.getOtpCode(),
                "REGISTER"
        );

        return Map.of(
                "success", true,
                "message", "Xác thực OTP đăng ký thành công"
        );
    }

    @PostMapping("/send-forgot-otp")
    public Map<String, Object> sendForgotOtp(@RequestBody SendOtpRequest request) {
        Account account = accountRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email chưa đăng ký tài khoản"));

        otpService.sendOtp(account.getEmail(), "FORGOT_PASSWORD");

        return Map.of(
                "success", true,
                "message", "Đã gửi OTP đặt lại mật khẩu tới email " + request.getEmail()
        );
    }

    @PostMapping("/reset-password")
    public Map<String, Object> resetPassword(@RequestBody ResetPasswordRequest request) {
        otpService.verifyOtp(
                request.getEmail(),
                request.getOtpCode(),
                "FORGOT_PASSWORD"
        );

        Account account = accountRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại"));

        account.setPassword(request.getNewPassword());

        accountRepository.save(account);

        return Map.of(
                "success", true,
                "message", "Đổi mật khẩu thành công"
        );
    }
}
