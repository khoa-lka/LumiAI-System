package com.cinema.backend.Payment;

import java.nio.charset.StandardCharsets;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class PayOSConfig {
public static final String CLIENT_ID =
 System.getenv().getOrDefault("PAYOS_CLIENT_ID", "");
public static final String API_KEY =
 System.getenv().getOrDefault("PAYOS_API_KEY", "");
public static final String CHECKSUM_KEY =
 System.getenv().getOrDefault("PAYOS_CHECKSUM_KEY", "");


    public static final String PAYOS_CREATE_URL =
            "https://api-merchant.payos.vn/v2/payment-requests";

    public static final String RETURN_URL =
            "http://localhost:8080/index.html";

    public static final String CANCEL_URL =
            "http://localhost:8080/index.html";

    public static String hmacSHA256(String data, String key) {
        try {
            Mac hmac256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey =
                    new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");

            hmac256.init(secretKey);

            byte[] hash = hmac256.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder result = new StringBuilder();

            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }

            return result.toString();

        } catch (Exception e) {
            throw new RuntimeException("Cannot create HMAC SHA256", e);
        }
    }
}
