package com.cinema.backend.Payment;

import org.springframework.stereotype.Service;
import jakarta.servlet.http.HttpServletRequest;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

// Service tạo link thanh toán VNPAY dùng cho Máy POS của Staff.
// Dùng chung VnPayConfig đã có sẵn trong project (không đổi gì ở VnPayConfig).
@Service
public class VNPayService {

    public String createPaymentUrl(int amount, String orderInfo, HttpServletRequest request) {
        String vnp_TxnRef = "ORD" + System.currentTimeMillis();

        // Lấy IP từ file Config của bạn
        String vnp_IpAddr = VnPayConfig.getIpAddress(request);

        // ⚠️ QUAN TRỌNG: KHÔNG dùng VnPayConfig.vnp_ReturnUrl (đang trỏ cứng về
        // "/index.html" — trang chủ của customer). Nếu dùng chung, VNPAY sẽ luôn
        // trả kết quả về trang chủ customer thay vì tab POS, khiến máy POS không
        // thể tự nhận biết thanh toán đã xong. Máy POS cần một đường trả về riêng
        // (/api/pos/vnpay-return) để tab con tự động báo kết quả lại cho tab POS.
        String posReturnUrl = getRequestBaseUrl(request) + "/api/pos/vnpay-return";

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", VnPayConfig.vnp_Version);
        vnp_Params.put("vnp_Command", VnPayConfig.vnp_Command);
        vnp_Params.put("vnp_TmnCode", VnPayConfig.vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amount * 100)); // VNPAY yêu cầu nhân 100
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", orderInfo);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", posReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        vnp_Params.put("vnp_CreateDate", formatter.format(cld.getTime()));

        // Thời gian hết hạn mã QR là 15 phút
        cld.add(Calendar.MINUTE, 15);
        vnp_Params.put("vnp_ExpireDate", formatter.format(cld.getTime()));

        // Tạo chuỗi Hash an toàn
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();

        while (itr.hasNext()) {
            String fieldName = (String) itr.next();
            String fieldValue = (String) vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                try {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()))
                         .append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (Exception e) {
                    e.printStackTrace();
                }
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        // Gọi hàm băm từ file Config của bạn
        String vnp_SecureHash = VnPayConfig.hmacSHA512(VnPayConfig.vnp_SecretKey, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return VnPayConfig.vnp_PayUrl + "?" + queryUrl;
    }

    // Tự dựng lại "http://host:port" từ chính request đang gọi tới, để URL trả về
    // luôn đúng dù chạy localhost lúc dev hay đổi sang domain/port khác lúc deploy.
    private String getRequestBaseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        boolean isDefaultPort = ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);
        return scheme + "://" + host + (isDefaultPort ? "" : ":" + port);
    }
}