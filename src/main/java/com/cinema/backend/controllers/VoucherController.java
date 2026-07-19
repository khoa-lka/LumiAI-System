package com.cinema.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cinema.backend.entities.Voucher;
import com.cinema.backend.service.VoucherService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@CrossOrigin("*")
public class VoucherController {

    @Autowired
    private VoucherService voucherService;
    
    @GetMapping("/{code}")
    public ResponseEntity<?> checkVoucher(@PathVariable String code) {
        // 🌟 NHÁNH 1: Nếu khách hàng muốn lấy toàn bộ danh sách Voucher đang được phát hành
        if ("all".equalsIgnoreCase(code)) {
            List<Voucher> publicActiveVouchers = voucherService.getAllVouchers().stream()
                    .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus())) // Chỉ lấy voucher đang mở
                    .filter(v -> v.getUsageLimit() != null && v.getUsageLimit() > 0) // Còn lượt sử dụng
                    .filter(v -> v.getExpiredDate() == null || v.getExpiredDate().isAfter(LocalDateTime.now())) // Chưa hết hạn
                    .toList();
            return ResponseEntity.ok(publicActiveVouchers);
        }

        // 🌟 NHÁNH 2: Kiểm tra một mã Voucher cụ thể (Logic cũ giữ nguyên)
        Voucher voucher = voucherService.checkVoucher(code);

        if (voucher == null) {
            return ResponseEntity.badRequest().body("Voucher không tồn tại");
        }

        if (voucher.getUsageLimit() <= 0) {
            return ResponseEntity.badRequest().body("Voucher đã hết lượt sử dụng");
        }

        if (voucher.getExpiredDate() != null && voucher.getExpiredDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Voucher đã hết hạn");
        }

        return ResponseEntity.ok(voucher);
    }

    // 🌟 API BỔ SUNG: Cho phép luồng Booking quét tìm khuyến mãi tự động (AUTO) phù hợp giá trị đơn
    @GetMapping("/check-auto")
    public ResponseEntity<?> checkAutoVoucher(@RequestParam("grossAmount") BigDecimal grossAmount) {
        Voucher autoVoucher = voucherService.checkAutoVoucher(grossAmount);
        if (autoVoucher == null) {
            return ResponseEntity.ok().body(null); // Trả về null êm đẹp nếu hiện tại không có ưu đãi tự động
        }
        return ResponseEntity.ok(autoVoucher);
    }

    // 🚀 API QUẢN TRỊ ĐƯỢC CHẶN CHO MANAGER (Giữ nguyên cấu hình cũ của nhóm)
    @GetMapping("/manager/all")
    public ResponseEntity<?> getAllVouchersForManager() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping("/manager/add")
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucher) {
        try {
            Voucher newVoucher = voucherService.createVoucher(voucher);
            return ResponseEntity.ok(newVoucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo voucher: " + e.getMessage());
        }
    }

    @PutMapping("/manager/update/{id}")
    public ResponseEntity<?> updateVoucher(@PathVariable Integer id, @RequestBody Voucher voucherDetails) {
        try {
            Voucher updatedVoucher = voucherService.updateVoucher(id, voucherDetails);
            return ResponseEntity.ok(updatedVoucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật voucher: " + e.getMessage());
        }
    }

    @DeleteMapping("/manager/delete/{id}")
    public ResponseEntity<?> deleteVoucher(@PathVariable Integer id) {
        try {
            voucherService.deleteVoucher(id);
            return ResponseEntity.ok("Xóa thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa voucher: " + e.getMessage());
        }
    }
}