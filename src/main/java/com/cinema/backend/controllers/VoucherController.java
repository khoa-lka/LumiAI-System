package com.cinema.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cinema.backend.entities.Voucher;
import com.cinema.backend.service.VoucherService;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin("*")
public class VoucherController {

    @Autowired
    private VoucherService voucherService;

    @GetMapping("/{code}")
public ResponseEntity<?> checkVoucher(@PathVariable String code) {

    Voucher voucher = voucherService.checkVoucher(code);

    if (voucher == null) {
        return ResponseEntity.badRequest().body("Voucher không tồn tại");
    }

    if (voucher.getUsageLimit() <= 0) {
        return ResponseEntity.badRequest().body("Voucher đã hết lượt sử dụng");
    }

    if (voucher.getExpiredDate().isBefore(java.time.LocalDateTime.now())) {
        return ResponseEntity.badRequest().body("Voucher đã hết hạn");
    }

    return ResponseEntity.ok(voucher);
}

}