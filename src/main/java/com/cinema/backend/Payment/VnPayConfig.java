package com.cinema.backend.Payment;

import java.nio.charset.StandardCharsets;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import jakarta.servlet.http.HttpServletRequest;

public class VnPayConfig {
    public static String vnp_PayUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    public static String vnp_ReturnUrl = "http://localhost:8080/index.html"; // Đường link nhảy về Frontend sau khi thanh toán xong
    public static String vnp_TmnCode = "9M988N81"; // 🌟 Lấy mã TMN Code hiển thị trên trang cấu hình Test Sandbox VNPAY của em
    public static String vnp_SecretKey = "XYZ123456789HASHSECRETKEYVNPAY"; // 🌟 Điền chuỗi mật mã bảo mật bí mật Chuỗi Hash Sandbox
    public static String vnp_Version = "2.1.0";
    public static String vnp_Command = "pay";

    // Thuật toán băm mã hóa bảo mật HMAC SHA512 bảo vệ tính toàn vẹn của dữ liệu hóa đơn giao dịch
    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) return null;
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }

    // Hàm lấy địa chỉ IP gốc của thiết bị khách hàng thực hiện giao dịch đặt vé
    public static String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null) {
            ipAddress = request.getRemoteAddr();
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }
}
