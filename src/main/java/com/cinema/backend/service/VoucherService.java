package com.cinema.backend.service;

import com.cinema.backend.entities.Voucher;
import java.util.List;

public interface VoucherService {
    Voucher checkVoucher(String code);
    boolean useVoucher(String code);
    List<Voucher> getAllVouchers();
    Voucher createVoucher(Voucher voucher);
    Voucher updateVoucher(Integer id, Voucher voucher);
    void deleteVoucher(Integer id);

    // 🌟 HÀM MỚI BỔ SUNG: Quét voucher tự động dựa trên tổng tiền hóa đơn (grossAmount)
    Voucher checkAutoVoucher(Double grossAmount);
}