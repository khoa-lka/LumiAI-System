package com.cinema.backend.service;

import com.cinema.backend.entities.Voucher;

public interface VoucherService {
     Voucher checkVoucher(String code);

    boolean useVoucher(String code);
}
