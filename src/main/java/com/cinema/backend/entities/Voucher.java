package com.cinema.backend.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "voucher")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voucher_id")
    private Integer voucherId;

    @Column(name = "voucher_code")
    private String voucherCode;

    @Column(name = "discount_value")
    private Double discountValue;

    @Column(name = "expired_date")
    private LocalDateTime expiredDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "discount_type")
    private String discountType;

    @Column(name = "max_discount")
    private BigDecimal maxDiscount;

    @Column(name = "minimum_order")
    private Integer minimumOrder;

    // 🌟 THÊM MỚI: Trạng thái đồng bộ ACTIVE / INACTIVE
    @Column(name = "status")
    private String status;

    // 💡 3 trường bọc lót tính năng Auto quét ngày đặc biệt
    @Column(name = "apply_type")
    private String applyType; // 'MANUAL' hoặc 'AUTO'

    @Column(name = "condition_type")
    private String conditionType; // 'DAY_OF_WEEK', 'LAST_DAY_OF_MONTH', 'NONE'

    @Column(name = "condition_value")
    private String conditionValue; // '3' (Thứ 4), 'TRUE', 'NONE'

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    @JsonIgnore
    @OneToMany(mappedBy = "voucher")
    private List<Order1> orders;


    
    public Voucher() {
    }

    public Integer getVoucherId() {
        return voucherId;
    }

    public void setVoucherId(Integer voucherId) {
        this.voucherId = voucherId;
    }

    public String getVoucherCode() {
        return voucherCode;
    }

    public void setVoucherCode(String voucherCode) {
        this.voucherCode = voucherCode;
    }

    public Double getDiscountValue() {
        return discountValue;
    }

    public void setDiscountValue(Double discountValue) {
        this.discountValue = discountValue;
    }

    public LocalDateTime getExpiredDate() {
        return expiredDate;
    }

    public void setExpiredDate(LocalDateTime expiredDate) {
        this.expiredDate = expiredDate;
    }

    public Integer getUsageLimit() {
        return usageLimit;
    }

    public void setUsageLimit(Integer usageLimit) {
        this.usageLimit = usageLimit;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Integer updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getDiscountType() {
        return discountType;
    }

    public void setDiscountType(String discountType) {
        this.discountType = discountType;
    }

    public BigDecimal getMaxDiscount() {
        return maxDiscount;
    }

    public void setMaxDiscount(BigDecimal maxDiscount) {
        this.maxDiscount = maxDiscount;
    }

    public Integer getMinimumOrder() {
        return minimumOrder;
    }

    public void setMinimumOrder(Integer minimumOrder) {
        this.minimumOrder = minimumOrder;
    }

    // --- GETTERS & SETTERS CHO CÁC TRƯỜNG MỚI BỔ SUNG ---
    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApplyType() {
        return applyType;
    }

    public void setApplyType(String applyType) {
        this.applyType = applyType;
    }

    public String getConditionType() {
        return conditionType;
    }

    public void setConditionType(String conditionType) {
        this.conditionType = conditionType;
    }

    public String getConditionValue() {
        return conditionValue;
    }

    public void setConditionValue(String conditionValue) {
        this.conditionValue = conditionValue;
    }

    public List<Order1> getOrders() {
        return orders;
    }

    public void setOrders(List<Order1> orders) {
        this.orders = orders;
    }

    
}
