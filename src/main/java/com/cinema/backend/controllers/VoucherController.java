package com.cinema.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

        if (voucher.getExpiredDate() != null && voucher.getExpiredDate().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Voucher đã hết hạn");
        }

        return ResponseEntity.ok(voucher);
    }

    // 🌟 API MỚI BỔ SUNG: Cho phép luồng Booking quét tìm khuyến mãi tự động (AUTO) phù hợp giá trị đơn
    @GetMapping("/check-auto")
    public ResponseEntity<?> checkAutoVoucher(@RequestParam("grossAmount") Double grossAmount) {
        Voucher autoVoucher = voucherService.checkAutoVoucher(grossAmount);
        if (autoVoucher == null) {
            return ResponseEntity.ok().body(null); // Trả về null êm đẹp nếu hiện tại không có ưu đãi tự động
        }
        return ResponseEntity.ok(autoVoucher);
    }
    // 🚀 API 1: Lấy toàn bộ danh sách Voucher cho bảng quản trị của Manager
    @GetMapping("/manager/all")
    public ResponseEntity<?> getAllVouchersForManager() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    // 🚀 API 2: Thêm mới Voucher chiến dịch
    @PostMapping("/manager/add")
    public ResponseEntity<?> createVoucher(@RequestBody Voucher voucher) {
        try {
            Voucher newVoucher = voucherService.createVoucher(voucher);
            return ResponseEntity.ok(newVoucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo voucher: " + e.getMessage());
        }
    }

    // 🚀 API 3: Cập nhật thông tin sửa đổi Voucher
    @PutMapping("/manager/update/{id}") // 🎯 Đã rút gọn sạch đẹp
    public ResponseEntity<?> updateVoucher(@PathVariable Integer id, @RequestBody Voucher voucherDetails) {
        try {
            Voucher updatedVoucher = voucherService.updateVoucher(id, voucherDetails);
            return ResponseEntity.ok(updatedVoucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật voucher: " + e.getMessage());
        }
    }

    // 🚀 API 4: Xóa Voucher vật lý khỏi hệ thống
    @DeleteMapping("/manager/delete/{id}") // 🎯 Đã rút gọn sạch đẹp
    public ResponseEntity<?> deleteVoucher(@PathVariable Integer id) {
        try {
            voucherService.deleteVoucher(id);
            return ResponseEntity.ok("Xóa thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa voucher: " + e.getMessage());
        }
    }
}