package com.cinema.backend.service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.cinema.backend.entities.CheckoutFoodItem;
import com.cinema.backend.entities.CheckoutRequest;

@Service
public class CheckoutHashService {

    public String createHash(
            CheckoutRequest request,
            BigDecimal serverAmount
    ) {
        try {
            String seats = request.getSeats() == null
                    ? ""
                    : request.getSeats()
                        .stream()
                        .map(String::trim)
                        .map(String::toUpperCase)
                        .sorted()
                        .collect(Collectors.joining(","));

            List<CheckoutFoodItem> foodItems =
                    request.getFnb() == null
                            ? List.of()
                            : request.getFnb();

            String fnb = foodItems
                    .stream()
                    .sorted(
                        Comparator.comparing(
                            CheckoutFoodItem::getFoodItemId
                        )
                    )
                    .map(item ->
                        item.getFoodItemId()
                                + ":"
                                + item.getQuantity()
                    )
                    .collect(Collectors.joining(","));

            String voucherCode =
                    request.getVoucherCode() == null
                            ? ""
                            : request.getVoucherCode()
                                .trim()
                                .toUpperCase();

            String rawData =
                    request.getAccountId()
                    + "|"
                    + request.getShowtimeId()
                    + "|"
                    + seats
                    + "|"
                    + fnb
                    + "|"
                    + voucherCode
                    + "|"
                    + serverAmount
                        .setScale(2)
                        .toPlainString();

            byte[] hashBytes = MessageDigest
                    .getInstance("SHA-256")
                    .digest(
                        rawData.getBytes(
                            StandardCharsets.UTF_8
                        )
                    );

            StringBuilder result = new StringBuilder();

            for (byte hashByte : hashBytes) {
                result.append(
                    String.format("%02x", hashByte)
                );
            }

            return result.toString();

        } catch (Exception exception) {
            throw new RuntimeException(
                "Không thể khóa dữ liệu thanh toán",
                exception
            );
        }
    }
}
