package com.cinema.backend.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;

import com.cinema.backend.entities.Voucher;
import com.cinema.backend.repositories.VoucherRepository;
import org.springframework.stereotype.Service;

@Service
public class VoucherServiceImpl implements VoucherService {

      @Autowired
    private VoucherRepository voucherRepository;

    @Override
public Voucher checkVoucher(String code) {

    Optional<Voucher> optionalVoucher = voucherRepository.findByVoucherCode(code);

    if (optionalVoucher.isEmpty()) {
        return null;
    }

    Voucher voucher = optionalVoucher.get();

    if (voucher.getUsageLimit() <= 0) {
        return null;
    }

    if (voucher.getExpiredDate().isBefore(LocalDateTime.now())) {
        return null;
    }

    return voucher;
}

    @Override
   public boolean useVoucher(String code){

    System.out.println("useVoucher chạy");

    Voucher voucher = checkVoucher(code);

    if(voucher==null){
        System.out.println("voucher null");
        return false;
    }

    System.out.println("Before = " + voucher.getUsageLimit());

    voucher.setUsageLimit(voucher.getUsageLimit()-1);

    voucherRepository.save(voucher);

    System.out.println("After = " + voucher.getUsageLimit());

    return true;
}
    
}
