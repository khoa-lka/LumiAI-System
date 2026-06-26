package com.cinema.backend.controllers;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.Payment.VnPayConfig;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {
    @GetMapping("/create-vnpay-url")
    public ResponseEntity<?> createVnPayPaymentUrl(
            @RequestParam("amount") long amount,
            @RequestParam(value = "bankCode", required = false) String bankCode,
            HttpServletRequest request) throws UnsupportedEncodingException {

        String vnp_TxnRef = String.valueOf(System.currentTimeMillis()); // Sinh mã đơn hàng ngẫu nhiên dựa trên thời gian thực
        String vnp_OrderInfo = "LAS Cinemas - Thanh toan hoa don ve xem phim:" + vnp_TxnRef;
        String vnp_IpAddr = VnPayConfig.getIpAddress(request);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", VnPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VnPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", VnPayConfig.vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // Quy tắc VNPAY bắt buộc nhân hệ số 100
        vnp_Params.put("vnp_CurrCode", "VND");
        
        // Cấu hình lựa chọn phương thức chi tiết từ Frontend gửi lên nếu có
        if (bankCode != null && !bankCode.isEmpty() && !bankCode.equals("ALL")) {
            vnp_Params.put("vnp_BankCode", bankCode); 
        }
        
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", VnPayConfig.vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        // Khởi tạo thời gian giao dịch và thời gian hết hạn thanh toán hóa đơn giữ ghế (15 phút)
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", now.format(formatter));
        vnp_Params.put("vnp_ExpireDate", now.plusMinutes(15).format(formatter));

        // Tiến hành sắp xếp danh sách các tham số theo bảng chữ cái Alphabet bắt buộc của VNPAY Gateway
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString())).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }
        
        String queryUrl = query.toString();
        String vnp_SecureHash = VnPayConfig.hmacSHA512(VnPayConfig.vnp_SecretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        
        String finalPaymentUrl = VnPayConfig.vnp_PayUrl + "?" + queryUrl;

        Map<String, String> result = new HashMap<>();
        result.put("paymentUrl", finalPaymentUrl);
        return ResponseEntity.ok(result);
    }
}
