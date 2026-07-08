package com.cinema.backend.service;

import java.time.LocalDateTime;

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
         Voucher voucher = voucherRepository.findByVoucherCode(code);

        if(voucher==null)
            return null;

        if(voucher.getUsageLimit()<=0)
            return null;

        if(voucher.getExpiredDate().isBefore(LocalDateTime.now()))
            return null;

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

    @Override
    public java.util.List<Voucher> getAllVouchers() {
        return voucherRepository.findAll();
    }

    @Override
    public Voucher createVoucher(Voucher voucher) {
        return voucherRepository.save(voucher);
    }

    @Override
    public Voucher updateVoucher(Integer id, Voucher voucherDetails) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại với id: " + id));
        
        voucher.setVoucherCode(voucherDetails.getVoucherCode());
        voucher.setDiscountValue(voucherDetails.getDiscountValue());
        voucher.setDiscountType(voucherDetails.getDiscountType());
        voucher.setMaxDiscount(voucherDetails.getMaxDiscount());
        voucher.setMinimumOrder(voucherDetails.getMinimumOrder());
        voucher.setUsageLimit(voucherDetails.getUsageLimit());
        voucher.setExpiredDate(voucherDetails.getExpiredDate());
        voucher.setUpdatedBy(voucherDetails.getUpdatedBy());
        
        return voucherRepository.save(voucher);
    }

    @Override
    public void deleteVoucher(Integer id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher không tồn tại with id: " + id));
        voucherRepository.delete(voucher);
    }
}
