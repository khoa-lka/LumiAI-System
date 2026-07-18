package com.cinema.backend.service;

import java.math.BigDecimal;

import com.cinema.backend.entities.Voucher;

public interface VoucherService {
    Voucher checkVoucher(String code);

    boolean useVoucher(String code);

    java.util.List<Voucher> getAllVouchers();
    Voucher createVoucher(Voucher voucher);
    Voucher updateVoucher(Integer id, Voucher voucher);
    void deleteVoucher(Integer id);

    // 🌟 HÀM MỚI: Tự động quét voucher hệ thống dựa trên tổng tiền hóa đơn
    Voucher checkAutoVoucher(BigDecimal grossAmount);
}
