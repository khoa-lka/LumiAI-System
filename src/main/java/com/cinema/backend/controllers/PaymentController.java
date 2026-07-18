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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;

import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.transaction.annotation.Transactional;

import com.cinema.backend.entities.Account;
import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.entities.PaymentTransaction;
import com.cinema.backend.repositories.AccountRepository;
import com.cinema.backend.repositories.PaymentTransactionRepository;
import com.cinema.backend.service.BookingPriceService;
import com.cinema.backend.service.CheckoutHashService;

import java.util.LinkedHashMap;

import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.cinema.backend.Payment.PayOSConfig;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {
@Autowired
private JdbcTemplate jdbcTemplate;

@Autowired
private ObjectMapper objectMapper;

@Autowired
private PaymentTransactionRepository paymentTransactionRepository;

@Autowired
private AccountRepository accountRepository;

@Autowired
private BookingPriceService bookingPriceService;

@Autowired
private CheckoutHashService checkoutHashService;

   @Transactional
@PostMapping("/vnpay/create")
public ResponseEntity<?> createVnPayPayment(
        @RequestBody CheckoutRequest request,
        @RequestParam(
                value = "bankCode",
                required = false
        ) String bankCode,
        HttpServletRequest servletRequest
) throws UnsupportedEncodingException {

    if (request == null) {
        throw new RuntimeException(
                "Dữ liệu thanh toán không tồn tại"
        );
    }

    if (request.getAccountId() == null) {
        throw new RuntimeException(
                "Thiếu tài khoản thanh toán"
        );
    }

    /*
     * Backend tự tính tiền.
     * Không dùng totalMoney hoặc amount từ frontend.
     */
    BigDecimal serverAmount =
            bookingPriceService
                    .calculateFinalAmount(request);

    if (serverAmount.compareTo(
            BigDecimal.ZERO
    ) <= 0) {
        throw new RuntimeException(
                "Số tiền thanh toán không hợp lệ"
        );
    }

    Account account =
            accountRepository
                    .findById(
                            request.getAccountId()
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Không tìm thấy tài khoản"
                            )
                    );

    /*
     * Mã này phải unique trong DB.
     */
    String vnpTxnRef =
            String.valueOf(
                    System.currentTimeMillis()
            );

    LocalDateTime now =
            LocalDateTime.now();

    /*
     * Tạo transaction PENDING trước khi chuyển sang VNPAY.
     */
    PaymentTransaction payment =
            new PaymentTransaction();

    payment.setTransactionCode(vnpTxnRef);
    payment.setProvider("VNPAY");
    payment.setAmount(serverAmount);
    payment.setPaymentStatus("PENDING");
    payment.setAccount(account);

    payment.setCheckoutHash(
            checkoutHashService.createHash(
                    request,
                    serverAmount
            )
    );

    payment.setCreatedAt(now);
    payment.setExpiredAt(
            now.plusMinutes(15)
    );

    payment.setConsumed(false);

    paymentTransactionRepository
            .saveAndFlush(payment);

    /*
     * Sau khi đã lưu PENDING mới tạo URL VNPAY.
     */
    long amountInVnd =
            serverAmount
                    .setScale(
                            0,
                            RoundingMode.UNNECESSARY
                    )
                    .longValueExact();

    String vnpOrderInfo =
            "LAS Cinemas - Thanh toan hoa don: "
                    + vnpTxnRef;

    String vnpIpAddr =
            VnPayConfig.getIpAddress(
                    servletRequest
            );

    Map<String, String> vnpParams =
            new HashMap<>();

    vnpParams.put(
            "vnp_Version",
            VnPayConfig.vnp_Version
    );

    vnpParams.put(
            "vnp_Command",
            VnPayConfig.vnp_Command
    );

    vnpParams.put(
            "vnp_TmnCode",
            VnPayConfig.vnp_TmnCode
    );

    vnpParams.put(
            "vnp_Amount",
            String.valueOf(
                    amountInVnd * 100
            )
    );

    vnpParams.put(
            "vnp_CurrCode",
            "VND"
    );

    if (bankCode != null &&
            !bankCode.isBlank() &&
            !"ALL".equalsIgnoreCase(
                    bankCode
            )) {

        vnpParams.put(
                "vnp_BankCode",
                bankCode
        );
    }

    vnpParams.put(
            "vnp_TxnRef",
            vnpTxnRef
    );

    vnpParams.put(
            "vnp_OrderInfo",
            vnpOrderInfo
    );

    vnpParams.put(
            "vnp_OrderType",
            "other"
    );

    vnpParams.put(
            "vnp_Locale",
            "vn"
    );

    vnpParams.put(
            "vnp_ReturnUrl",
            VnPayConfig.vnp_ReturnUrl
    );

    vnpParams.put(
            "vnp_IpAddr",
            vnpIpAddr
    );

    DateTimeFormatter formatter =
            DateTimeFormatter.ofPattern(
                    "yyyyMMddHHmmss"
            );

    vnpParams.put(
            "vnp_CreateDate",
            now.format(formatter)
    );

    vnpParams.put(
            "vnp_ExpireDate",
            now.plusMinutes(15)
                    .format(formatter)
    );

    List<String> fieldNames =
            new ArrayList<>(
                    vnpParams.keySet()
            );

    Collections.sort(fieldNames);

    StringBuilder hashData =
            new StringBuilder();

    StringBuilder query =
            new StringBuilder();

    Iterator<String> iterator =
            fieldNames.iterator();

    while (iterator.hasNext()) {

        String fieldName =
                iterator.next();

        String fieldValue =
                vnpParams.get(fieldName);

        if (fieldValue != null &&
                !fieldValue.isEmpty()) {

            hashData
                    .append(fieldName)
                    .append("=")
                    .append(
                            URLEncoder.encode(
                                    fieldValue,
                                    StandardCharsets
                                            .US_ASCII
                                            .toString()
                            )
                    );

            query.append(
                    URLEncoder.encode(
                            fieldName,
                            StandardCharsets
                                    .US_ASCII
                                    .toString()
                    )
            );

            query.append("=");

            query.append(
                    URLEncoder.encode(
                            fieldValue,
                            StandardCharsets
                                    .US_ASCII
                                    .toString()
                    )
            );

            if (iterator.hasNext()) {
                hashData.append("&");
                query.append("&");
            }
        }
    }

    String secureHash =
            VnPayConfig.hmacSHA512(
                    VnPayConfig.vnp_SecretKey,
                    hashData.toString()
            );

    String paymentUrl =
            VnPayConfig.vnp_PayUrl
                    + "?"
                    + query
                    + "&vnp_SecureHash="
                    + secureHash;

    Map<String, Object> result =
            new HashMap<>();

    result.put(
            "success",
            true
    );

    result.put(
            "paymentUrl",
            paymentUrl
    );

    result.put(
            "paymentReference",
            vnpTxnRef
    );

    result.put(
            "amount",
            serverAmount
    );

    result.put(
            "paymentStatus",
            "PENDING"
    );

    return ResponseEntity.ok(result);
}

@GetMapping("/qr/status/{qrRef}")
public ResponseEntity<?> getQrPaymentStatus(
        @PathVariable String qrRef
) {
    PaymentTransaction payment =
            paymentTransactionRepository
                .findByTransactionCode(qrRef)
                .orElse(null);

    if (payment == null) {
        return ResponseEntity.ok(
            Map.of(
                "qrRef", qrRef,
                "paymentStatus", "NOT_FOUND"
            )
        );
    }

    return ResponseEntity.ok(
        Map.of(
            "qrRef", payment.getTransactionCode(),
            "amount", payment.getAmount(),
            "paymentStatus",
                payment.getPaymentStatus()
        )
    );
}

@Transactional
@PostMapping("/qr/cancel/{qrRef}")
public ResponseEntity<?> cancelQrPayment(
        @PathVariable String qrRef
) {
    PaymentTransaction payment =
            paymentTransactionRepository
                    .findByTransactionCodeForUpdate(qrRef)
                    .orElse(null);

    if (payment == null) {
        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Không tìm thấy giao dịch PayOS"
                        )
                );
    }

    if ("SUCCESS".equalsIgnoreCase(
            payment.getPaymentStatus()
    )) {
        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Không thể hủy giao dịch đã thanh toán"
                        )
                );
    }

    if (Boolean.TRUE.equals(payment.getConsumed())) {
        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Giao dịch đã được sử dụng"
                        )
                );
    }

    payment.setPaymentStatus("CANCELLED");

    paymentTransactionRepository.save(payment);

    return ResponseEntity.ok(
            Map.of(
                    "success", true,
                    "qrRef", qrRef,
                    "paymentStatus", "CANCELLED"
            )
    );
}

@PostMapping("/payos/create")
public ResponseEntity<?> createPayOSPayment(
        @RequestBody CheckoutRequest request
) {
    PaymentTransaction payment = null;

    try {
        // =================================================
        // 1. KIỂM TRA REQUEST
        // =================================================
        if (request == null) {
            throw new RuntimeException(
                    "Dữ liệu thanh toán không tồn tại"
            );
        }

        if (request.getAccountId() == null) {
            throw new RuntimeException(
                    "Thiếu accountId"
            );
        }

        if (request.getShowtimeId() == null) {
            throw new RuntimeException(
                    "Thiếu showtimeId"
            );
        }

        if (request.getSeats() == null ||
                request.getSeats().isEmpty()) {

            throw new RuntimeException(
                    "Danh sách ghế không được để trống"
            );
        }

        // =================================================
        // 2. BACKEND TỰ TÍNH SỐ TIỀN
        // =================================================
        BigDecimal serverAmount =
                bookingPriceService
                        .calculateFinalAmount(request);

        long amount;

        try {
            amount = serverAmount.longValueExact();
        } catch (ArithmeticException exception) {
            throw new RuntimeException(
                    "Số tiền thanh toán không hợp lệ"
            );
        }

        // =================================================
        // 3. LẤY TÀI KHOẢN
        // =================================================
        Account account = accountRepository
                .findById(request.getAccountId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Không tìm thấy tài khoản"
                        )
                );

        // Dùng millisecond để giảm nguy cơ trùng orderCode
        long orderCode =
                System.currentTimeMillis();

        String transactionCode =
                String.valueOf(orderCode);

        String description =
                "LAS" + orderCode;

        String returnUrl =
                PayOSConfig.RETURN_URL;

        String cancelUrl =
                PayOSConfig.CANCEL_URL;

        // =================================================
        // 4. TẠO PAYMENT PENDING TRONG DATABASE
        // =================================================
        payment = new PaymentTransaction();

        payment.setTransactionCode(
                transactionCode
        );

        payment.setAmount(
                serverAmount
        );

        payment.setPaymentStatus(
                "PENDING"
        );

        payment.setProvider(
                "PAYOS"
        );

        payment.setAccount(
                account
        );

        payment.setCreatedAt(
                LocalDateTime.now()
        );

        payment.setExpiredAt(
                LocalDateTime.now().plusMinutes(15)
        );

        payment.setConsumed(false);

        payment.setCheckoutHash(
                checkoutHashService.createHash(
                        request,
                        serverAmount
                )
        );

        paymentTransactionRepository
                .saveAndFlush(payment);

        // =================================================
        // 5. TẠO CHỮ KÝ REQUEST PAYOS
        // =================================================
        String rawSignature =
                "amount=" + amount
                        + "&cancelUrl=" + cancelUrl
                        + "&description=" + description
                        + "&orderCode=" + orderCode
                        + "&returnUrl=" + returnUrl;

        String signature =
                PayOSConfig.hmacSHA256(
                        rawSignature,
                        PayOSConfig.CHECKSUM_KEY
                );

        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put("orderCode", orderCode);
        body.put("amount", amount);
        body.put("description", description);
        body.put("returnUrl", returnUrl);
        body.put("cancelUrl", cancelUrl);
        body.put("signature", signature);

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_JSON
        );

        headers.set(
                "x-client-id",
                PayOSConfig.CLIENT_ID
        );

        headers.set(
                "x-api-key",
                PayOSConfig.API_KEY
        );

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(
                        body,
                        headers
                );

        RestTemplate restTemplate =
                new RestTemplate();

        ResponseEntity<Map> response =
                restTemplate.postForEntity(
                        PayOSConfig.PAYOS_CREATE_URL,
                        entity,
                        Map.class
                );

        Map<?, ?> responseBody =
                response.getBody();

        // =================================================
        // 6. KIỂM TRA PAYOS CÓ TẠO LINK THÀNH CÔNG KHÔNG
        // =================================================
        if (responseBody == null ||
                !"00".equals(
                        String.valueOf(
                                responseBody.get("code")
                        )
                )) {

            payment.setPaymentStatus("FAILED");

            paymentTransactionRepository
                    .save(payment);

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "PayOS không tạo được giao dịch"
                            )
                    );
        }

        // =================================================
        // 7. LƯU PAYMENT LINK ID
        // =================================================
        Object dataObject =
                responseBody.get("data");

        if (dataObject instanceof Map<?, ?> data) {
            Object paymentLinkId =
                    data.get("paymentLinkId");

            if (paymentLinkId != null) {
                payment.setProviderPaymentLinkId(
                        String.valueOf(
                                paymentLinkId
                        )
                );
            }
        }

        paymentTransactionRepository.save(payment);

        return ResponseEntity.ok(responseBody);

    } catch (Exception exception) {
        exception.printStackTrace();

        if (payment != null &&
                "PENDING".equalsIgnoreCase(
                        payment.getPaymentStatus()
                )) {

            payment.setPaymentStatus("FAILED");

            paymentTransactionRepository.save(payment);
        }

        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                exception.getMessage() == null
                                        ? "Không thể tạo thanh toán PayOS"
                                        : exception.getMessage()
                        )
                );
    }
}


@Transactional
@GetMapping("/vnpay/verify")
public ResponseEntity<?> verifyVnPay(
        @RequestParam Map<String, String> receivedParams
) {
    try {
        String receivedSecureHash =
                receivedParams.get("vnp_SecureHash");

        if (receivedSecureHash == null ||
                receivedSecureHash.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Thiếu chữ ký VNPAY"
                            )
                    );
        }

        /*
         * Sao chép tham số để không thay đổi map gốc.
         */
        Map<String, String> verifyParams =
                new HashMap<>(receivedParams);

        verifyParams.remove(
                "vnp_SecureHash"
        );

        verifyParams.remove(
                "vnp_SecureHashType"
        );

        /*
         * Sắp xếp tham số đúng như lúc tạo URL VNPAY.
         */
        List<String> fieldNames =
                new ArrayList<>(
                        verifyParams.keySet()
                );

        Collections.sort(fieldNames);

        StringBuilder hashData =
                new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue =
                    verifyParams.get(fieldName);

            if (fieldValue == null ||
                    fieldValue.isEmpty()) {
                continue;
            }

            if (hashData.length() > 0) {
                hashData.append("&");
            }

            hashData
                    .append(fieldName)
                    .append("=")
                    .append(
                            URLEncoder.encode(
                                    fieldValue,
                                    StandardCharsets
                                            .US_ASCII
                                            .toString()
                            )
                    );
        }

        String calculatedSecureHash =
                VnPayConfig.hmacSHA512(
                        VnPayConfig.vnp_SecretKey,
                        hashData.toString()
                );

        /*
         * Không tin dữ liệu URL trước khi chữ ký hợp lệ.
         */
        if (!calculatedSecureHash
                .equalsIgnoreCase(
                        receivedSecureHash
                )) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Chữ ký VNPAY không hợp lệ"
                            )
                    );
        }

        String transactionReference =
                receivedParams.get(
                        "vnp_TxnRef"
                );

        String responseCode =
                receivedParams.get(
                        "vnp_ResponseCode"
                );

        String transactionStatus =
                receivedParams.get(
                        "vnp_TransactionStatus"
                );

        String receivedAmountText =
                receivedParams.get(
                        "vnp_Amount"
                );

        if (transactionReference == null ||
                transactionReference.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Thiếu mã giao dịch VNPAY"
                            )
                    );
        }

        if (receivedAmountText == null ||
                receivedAmountText.isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Thiếu số tiền VNPAY"
                            )
                    );
        }

        /*
         * VNPAY gửi số tiền đã nhân 100.
         * Ví dụ 12.000.000 tương ứng 120.000 VND.
         */
        BigDecimal receivedAmount =
                new BigDecimal(
                        receivedAmountText
                ).movePointLeft(2);

        PaymentTransaction payment =
                paymentTransactionRepository
                        .findByTransactionCodeForUpdate(
                                transactionReference
                        )
                        .orElse(null);

        if (payment == null) {
            return ResponseEntity
                    .status(404)
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Không tìm thấy giao dịch VNPAY"
                            )
                    );
        }

        if (payment.getProvider() == null ||
                !"VNPAY".equalsIgnoreCase(
                        payment.getProvider()
                )) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Giao dịch không thuộc VNPAY"
                            )
                    );
        }

        if (payment.getAmount() == null ||
                payment.getAmount()
                        .compareTo(
                                receivedAmount
                        ) != 0) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Số tiền VNPAY không khớp",
                                    "expectedAmount",
                                    payment.getAmount(),
                                    "receivedAmount",
                                    receivedAmount
                            )
                    );
        }

        /*
         * Chữ ký đúng nhưng giao dịch bị hủy hoặc thất bại.
         */
        if (!"00".equals(responseCode) ||
                !"00".equals(
                        transactionStatus
                )) {

            payment.setPaymentStatus(
                    "FAILED"
            );

            paymentTransactionRepository
                    .save(payment);

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Thanh toán VNPAY không thành công",
                                    "responseCode",
                                    responseCode == null
                                            ? ""
                                            : responseCode
                            )
                    );
        }

        /*
         * Idempotent: reload trang không cập nhật lại nhiều lần.
         */
        if (!"SUCCESS".equalsIgnoreCase(
                payment.getPaymentStatus()
        )) {
            payment.setPaymentStatus(
                    "SUCCESS"
            );

            payment.setPaidAt(
                    LocalDateTime.now()
            );

            paymentTransactionRepository
                    .save(payment);
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "paymentStatus",
                        "SUCCESS",
                        "paymentReference",
                        transactionReference,
                        "amount",
                        payment.getAmount(),
                        "consumed",
                        Boolean.TRUE.equals(
                                payment.getConsumed()
                        )
                )
        );

    } catch (NumberFormatException exception) {
        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Số tiền VNPAY không hợp lệ"
                        )
                );

    } catch (Exception exception) {
        exception.printStackTrace();

        return ResponseEntity
                .internalServerError()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                exception.getMessage() == null
                                        ? "Lỗi xác minh VNPAY"
                                        : exception.getMessage()
                        )
                );
    }
}

@Transactional
@PostMapping("/payos/webhook")
public ResponseEntity<?> payOSWebhook(
        @RequestBody Map<String, Object> payload
) {
    long startTime =
            System.currentTimeMillis();

    System.out.println(
            "===== PAYOS WEBHOOK ====="
    );

    System.out.println(payload);

    // =====================================================
    // 1. KIỂM TRA CHỮ KÝ
    // =====================================================
    if (!isValidPayOSWebhookSignature(payload)) {
        savePayOSWebhookLog(
                payload,
                401,
                "failed",
                startTime
        );

        return ResponseEntity
                .status(401)
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Chữ ký webhook không hợp lệ"
                        )
                );
    }

    // =====================================================
    // 2. KIỂM TRA KẾT QUẢ THANH TOÁN
    // =====================================================
    Boolean success =
            (Boolean) payload.get("success");

    String responseCode =
            String.valueOf(
                    payload.get("code")
            );

    if (!Boolean.TRUE.equals(success) ||
            !"00".equals(responseCode)) {

        savePayOSWebhookLog(
                payload,
                400,
                "failed",
                startTime
        );

        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Giao dịch PayOS không thành công"
                        )
                );
    }

    Object dataObject =
            payload.get("data");

    if (!(dataObject instanceof Map)) {
        savePayOSWebhookLog(
                payload,
                400,
                "failed",
                startTime
        );

        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Webhook không có data"
                        )
                );
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> data =
            (Map<String, Object>) dataObject;

    try {
        // =================================================
        // 3. LẤY ORDER CODE VÀ AMOUNT
        // =================================================
        String orderCode =
                String.valueOf(
                        data.get("orderCode")
                );

        BigDecimal receivedAmount =
                new BigDecimal(
                        String.valueOf(
                                data.get("amount")
                        )
                );

        // =================================================
        // 4. LẤY VÀ KHÓA PAYMENT
        // =================================================
        PaymentTransaction payment =
                paymentTransactionRepository
                        .findByTransactionCodeForUpdate(
                                orderCode
                        )
                        .orElse(null);

        /*
         * PayOS có thể gửi webhook mẫu lúc đăng ký URL.
         * Không tìm thấy transaction thì vẫn trả 200,
         * nhưng tuyệt đối không tạo giao dịch SUCCESS giả.
         */
        if (payment == null) {
            savePayOSWebhookLog(
                    payload,
                    200,
                    "success",
                    startTime
            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Webhook hợp lệ nhưng không tìm thấy giao dịch",
                            "orderCode", orderCode,
                            "transactionFound", false
                    )
            );
        }

        // =================================================
        // 5. KIỂM TRA PROVIDER
        // =================================================
        if (!"PAYOS".equalsIgnoreCase(
                payment.getProvider()
        )) {
            savePayOSWebhookLog(
                    payload,
                    400,
                    "failed",
                    startTime
            );

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Giao dịch không thuộc PayOS"
                            )
                    );
        }

        // =================================================
        // 6. KIỂM TRA SỐ TIỀN
        // =================================================
        if (payment.getAmount() == null ||
                payment.getAmount()
                        .compareTo(receivedAmount) != 0) {

            savePayOSWebhookLog(
                    payload,
                    400,
                    "failed",
                    startTime
            );

            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Sai số tiền thanh toán",
                                    "expectedAmount",
                                    payment.getAmount(),
                                    "receivedAmount",
                                    receivedAmount
                            )
                    );
        }

        // =================================================
        // 7. CHỐNG WEBHOOK GỬI LẶP
        // =================================================
        if ("SUCCESS".equalsIgnoreCase(
                payment.getPaymentStatus()
        )) {
            savePayOSWebhookLog(
                    payload,
                    200,
                    "success",
                    startTime
            );

            return ResponseEntity.ok(
                    Map.of(
                            "success", true,
                            "message",
                            "Giao dịch đã được xác nhận trước đó",
                            "orderCode", orderCode,
                            "paymentStatus", "SUCCESS"
                    )
            );
        }

        if ("CANCELLED".equalsIgnoreCase(
                payment.getPaymentStatus()
        )) {
            return ResponseEntity
                    .badRequest()
                    .body(
                            Map.of(
                                    "success", false,
                                    "message",
                                    "Giao dịch đã bị hủy"
                            )
                    );
        }

        // =================================================
        // 8. CẬP NHẬT SUCCESS
        // =================================================
        payment.setPaymentStatus(
                "SUCCESS"
        );

        payment.setPaidAt(
                LocalDateTime.now()
        );

        Object paymentLinkId =
                data.get("paymentLinkId");

        if (paymentLinkId != null) {
            payment.setProviderPaymentLinkId(
                    String.valueOf(
                            paymentLinkId
                    )
            );
        }

        paymentTransactionRepository.save(payment);

        savePayOSWebhookLog(
                payload,
                200,
                "success",
                startTime
        );

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "orderCode", orderCode,
                        "paymentStatus", "SUCCESS"
                )
        );

    } catch (Exception exception) {
        exception.printStackTrace();

        savePayOSWebhookLog(
                payload,
                400,
                "failed",
                startTime
        );

        return ResponseEntity
                .badRequest()
                .body(
                        Map.of(
                                "success", false,
                                "message",
                                "Dữ liệu webhook không hợp lệ"
                        )
                );
    }
}

private boolean isValidPayOSWebhookSignature(
        Map<String, Object> payload
        
) {
    try {
        Object signatureObject = payload.get("signature");
        Object dataObject = payload.get("data");

        if (signatureObject == null ||
                !(dataObject instanceof Map)) {
            return false;
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> data =
                (Map<String, Object>) dataObject;

        List<String> keys =
                new ArrayList<>(data.keySet());

        Collections.sort(keys);

        StringBuilder rawData =
                new StringBuilder();

        for (String key : keys) {
            if (rawData.length() > 0) {
                rawData.append("&");
            }

            Object value = data.get(key);

            rawData.append(key)
                    .append("=")
                    .append(value == null ? "" : value);
        }

        String expectedSignature =
                PayOSConfig.hmacSHA256(
                        rawData.toString(),
                        PayOSConfig.CHECKSUM_KEY
                );

        String receivedSignature =
                String.valueOf(signatureObject).trim();

        return MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                receivedSignature.getBytes(StandardCharsets.UTF_8)
        );

    } catch (Exception exception) {
        System.out.println(
                "Lỗi kiểm tra PayOS signature: "
                        + exception.getMessage()
        );

        return false;
    }
}
private void savePayOSWebhookLog(
        Map<String, Object> payload,
        int httpCode,
        String status,
        long startTime
) {
    try {
        String payloadJson =
                objectMapper.writeValueAsString(payload);

        long responseMs =
                System.currentTimeMillis() - startTime;

        byte[] payloadBytes =
                payloadJson.getBytes(StandardCharsets.UTF_8);

        BigDecimal sizeKb =
                BigDecimal.valueOf(
                        payloadBytes.length / 1024.0
                ).setScale(
                        2,
                        RoundingMode.HALF_UP
                );

        jdbcTemplate.update(
                """
                INSERT INTO webhook_logs
                (
                    time_created,
                    endpoint,
                    http_code,
                    status,
                    response_ms,
                    size_kb,
                    payload
                )
                VALUES
                (
                    GETDATE(),
                    ?, ?, ?, ?, ?, ?
                )
                """,
                "/api/payment/payos/webhook",
                httpCode,
                status,
                responseMs,
                sizeKb,
                payloadJson
        );

    } catch (Exception exception) {
        // Lỗi ghi log không được làm hỏng thanh toán
        System.out.println(
                "Không thể ghi Webhook Log: "
                        + exception.getMessage()
        );
    }
}
}