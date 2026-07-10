package com.cinema.backend.service;

import com.cinema.backend.entities.EmailOtp;
import com.cinema.backend.repositories.EmailOtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    @Autowired
    private EmailService emailService;

    public void sendOtp(String email, String purpose) {
        String otp = generateOtp();

        EmailOtp emailOtp = new EmailOtp();
        emailOtp.setEmail(email);
        emailOtp.setOtpCode(otp);
        emailOtp.setPurpose(purpose);
        emailOtp.setExpiredAt(LocalDateTime.now().plusMinutes(5));
        emailOtp.setVerified(false);

        emailOtpRepository.save(emailOtp);

        String subject;
        String content;

        if ("REGISTER".equals(purpose)) {
            subject = "Mã OTP đăng ký tài khoản LAS Cinema";
            content = "Mã OTP đăng ký tài khoản của bạn là: " + otp +
                    "\nMã có hiệu lực trong 5 phút.";
        } else {
            subject = "Mã OTP đặt lại mật khẩu LAS Cinema";
            content = "Mã OTP đặt lại mật khẩu của bạn là: " + otp +
                    "\nMã có hiệu lực trong 5 phút.";
        }

        emailService.sendSimpleEmail(email, subject, content);
    }

    public boolean verifyOtp(String email, String otpCode, String purpose) {
        EmailOtp otp = emailOtpRepository
                .findTopByEmailAndPurposeOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy OTP"));

        if (Boolean.TRUE.equals(otp.getVerified())) {
            throw new RuntimeException("OTP này đã được sử dụng");
        }

        if (LocalDateTime.now().isAfter(otp.getExpiredAt())) {
            throw new RuntimeException("OTP đã hết hạn");
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            throw new RuntimeException("OTP không chính xác");
        }

        otp.setVerified(true);
        emailOtpRepository.save(otp);

        return true;
    }

    private String generateOtp() {
        int otp = 100000 + new Random().nextInt(900000);
        return String.valueOf(otp);
    }
}
