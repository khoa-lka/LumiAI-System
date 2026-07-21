package com.cinema.backend.controllers;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.CheckoutRequest;
import com.cinema.backend.service.BookingPriceService;

@RestController
@RequestMapping("/api/booking-price")
@CrossOrigin(origins = "*")
public class BookingPriceController {

    @Autowired
    private BookingPriceService bookingPriceService;

    @PostMapping("/preview")
    public ResponseEntity<?> previewPrice(
            @RequestBody CheckoutRequest request
    ) {
        try {
            BigDecimal finalAmount =
                    bookingPriceService
                            .calculateFinalAmount(
                                    request
                            );

            Map<String, Object> response =
                    new LinkedHashMap<>();

            response.put(
                    "success",
                    true
            );

            response.put(
                    "finalAmount",
                    finalAmount
            );

            return ResponseEntity.ok(
                    response
            );

        } catch (RuntimeException exception) {
            return ResponseEntity
                    .badRequest()
                    .body(
                        Map.of(
                            "success",
                            false,
                            "message",
                            exception.getMessage()
                        )
                    );
        }
    }
}