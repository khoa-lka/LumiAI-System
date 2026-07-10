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

import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.cinema.backend.dto.QrWebhookDTO;

import java.util.LinkedHashMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.cinema.backend.Payment.PayOSConfig;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {
private final Map<String, QrPaymentSession> qrSessions = new ConcurrentHashMap<>();

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
        
        // ==========================================================================
        // 🌟 KHÔI PHỤC HÀM BĂM CHUỖI CHUẨN CHỈ 100% THEO CHUẨN MẪU GỐC VNPAY JAVA SDK
        // ==========================================================================
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                
                // 1. Build hash data: Sử dụng tên trường thô và mã hóa giá trị trường bằng US_ASCII
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                
                // 2. Build query URL: Mã hóa cả tên trường và giá trị trường đồng bộ 100% với SDK mẫu
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                
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

    @GetMapping("/qr/create")
public ResponseEntity<?> createQrPayment(@RequestParam("amount") long amount) {

    String qrRef = "QR-" + System.currentTimeMillis();

    QrPaymentSession session = new QrPaymentSession();
    session.qrRef = qrRef;
    session.amount = amount;
    session.createdAt = LocalDateTime.now();
    session.paymentStatus = "PENDING";

    qrSessions.put(qrRef, session);

    Map<String, Object> result = new HashMap<>();
    result.put("qrRef", qrRef);
    result.put("amount", amount);
    result.put("paymentStatus", "PENDING");

    return ResponseEntity.ok(result);
}

@GetMapping("/qr/status/{qrRef}")
public ResponseEntity<?> getQrPaymentStatus(@PathVariable String qrRef) {

    QrPaymentSession session = qrSessions.get(qrRef);

    if (session == null) {
        Map<String, Object> result = new HashMap<>();
        result.put("qrRef", qrRef);
        result.put("paymentStatus", "NOT_FOUND");
        return ResponseEntity.ok(result);
    }


    Map<String, Object> result = new HashMap<>();
    result.put("qrRef", session.qrRef);
    result.put("amount", session.amount);
    result.put("paymentStatus", session.paymentStatus);

    return ResponseEntity.ok(result);
}

@PostMapping("/qr/cancel/{qrRef}")
public ResponseEntity<?> cancelQrPayment(@PathVariable String qrRef) {

    QrPaymentSession session = qrSessions.get(qrRef);

    if (session != null) {
        session.paymentStatus = "CANCELLED";
    }

    Map<String, Object> result = new HashMap<>();
    result.put("qrRef", qrRef);
    result.put("paymentStatus", "CANCELLED");

    return ResponseEntity.ok(result);
}

static class QrPaymentSession {
    String qrRef;
    long amount;
    LocalDateTime createdAt;
    String paymentStatus;
}

@PostMapping("/qr/webhook")
public ResponseEntity<?> qrWebhook(@RequestBody QrWebhookDTO webhook) {

    System.out.println("===== QR WEBHOOK RECEIVED =====");
    System.out.println(webhook);

    String qrRef = webhook.getQrRef();

    if (qrRef == null || qrRef.isBlank()) {
        String desc = webhook.getDescription();

        if (desc != null) {
            int index = desc.indexOf("QR-");

            if (index >= 0) {
                qrRef = desc.substring(index).split("\\s+")[0];
            }
        }
    }

    if (qrRef == null || qrRef.isBlank()) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "Không tìm thấy qrRef trong webhook");
        return ResponseEntity.badRequest().body(result);
    }

    QrPaymentSession session = qrSessions.get(qrRef);

    if (session == null) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "Không tìm thấy phiên QR: " + qrRef);
        return ResponseEntity.ok(result);
    }

    if (webhook.getAmount() == null ||
            webhook.getAmount().longValue() != session.amount) {

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", "Sai số tiền thanh toán");
        result.put("expectedAmount", session.amount);
        result.put("receivedAmount", webhook.getAmount());

        return ResponseEntity.ok(result);
    }

    session.paymentStatus = "SUCCESS";

    Map<String, Object> result = new HashMap<>();
    result.put("success", true);
    result.put("qrRef", qrRef);
    result.put("paymentStatus", "SUCCESS");

    return ResponseEntity.ok(result);
}

@PostMapping("/payos/create")
public ResponseEntity<?> createPayOSPayment(@RequestBody Map<String, Object> req) {

    try {
        long amount = Long.parseLong(req.get("amount").toString());

        long orderCode = System.currentTimeMillis() / 1000;

        String description = "LAS" + orderCode;

        String returnUrl = PayOSConfig.RETURN_URL;
        String cancelUrl = PayOSConfig.CANCEL_URL;

        String rawSignature =
                "amount=" + amount +
                "&cancelUrl=" + cancelUrl +
                "&description=" + description +
                "&orderCode=" + orderCode +
                "&returnUrl=" + returnUrl;

        String signature = PayOSConfig.hmacSHA256(
                rawSignature,
                PayOSConfig.CHECKSUM_KEY
        );

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("orderCode", orderCode);
        body.put("amount", amount);
        body.put("description", description);
        body.put("returnUrl", returnUrl);
        body.put("cancelUrl", cancelUrl);
        body.put("signature", signature);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", PayOSConfig.CLIENT_ID);
        headers.set("x-api-key", PayOSConfig.API_KEY);

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(body, headers);

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<Map> response = restTemplate.postForEntity(
                PayOSConfig.PAYOS_CREATE_URL,
                entity,
                Map.class
        );

        Map responseBody = response.getBody();

        if (responseBody != null && "00".equals(responseBody.get("code"))) {
        QrPaymentSession session = new QrPaymentSession();
        session.qrRef = String.valueOf(orderCode);
        session.amount = amount;
        session.createdAt = LocalDateTime.now();
        session.paymentStatus = "PENDING";

        qrSessions.put(session.qrRef, session);
}

        return ResponseEntity.ok(response.getBody());

    } catch (Exception e) {
        e.printStackTrace();

        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("message", e.getMessage());

        return ResponseEntity.badRequest().body(error);
    }
}

@PostMapping("/payos/webhook")
public ResponseEntity<?> payOSWebhook(@RequestBody Map<String, Object> payload) {

    System.out.println("===== PAYOS WEBHOOK =====");
    System.out.println(payload);

    Boolean success = (Boolean) payload.get("success");

    if (success == null || !success) {
        return ResponseEntity.ok(Map.of("success", false));
    }

    Map<String, Object> data = (Map<String, Object>) payload.get("data");

    if (data == null) {
        return ResponseEntity.ok(Map.of("success", false));
    }

    String orderCode = String.valueOf(data.get("orderCode"));
    long amount = Long.parseLong(data.get("amount").toString());

    QrPaymentSession session = qrSessions.get(orderCode);

    if (session == null) {
        return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Không tìm thấy session orderCode " + orderCode
        ));
    }

    if (session.amount != amount) {
        return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Sai số tiền"
        ));
    }

    session.paymentStatus = "SUCCESS";

    return ResponseEntity.ok(Map.of(
            "success", true,
            "orderCode", orderCode,
            "paymentStatus", "SUCCESS"
    ));
}
}