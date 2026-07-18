package com.cinema.backend.entities;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutRequest {
     private Integer accountId;

    private Integer showtimeId;

    private String email;

    private List<String> seats;

    private BigDecimal totalMoney;

    private String paymentMethod;

    private String movieName;

    private String voucherCode;

    private List<CheckoutFoodItem> fnb;

    private BigDecimal grossAmount;

    private String paymentReference;

    public String getPaymentReference() {
    return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
    this.paymentReference = paymentReference;
    }

    
    public String getVoucherCode() {
    return voucherCode;
}

public void setVoucherCode(String voucherCode) {
    this.voucherCode = voucherCode;
}

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public Integer getShowtimeId() {
        return showtimeId;
    }

    public void setShowtimeId(Integer showtimeId) {
        this.showtimeId = showtimeId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getSeats() {
        return seats;
    }

    public void setSeats(List<String> seats) {
        this.seats = seats;
    }

    public BigDecimal getTotalMoney() {
        return totalMoney;
    }

    public void setTotalMoney(BigDecimal totalMoney) {
        this.totalMoney = totalMoney;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getMovieName() {
        return movieName;
    }

    public void setMovieName(String movieName) {
        this.movieName = movieName;
    }

    public List<CheckoutFoodItem> getFnb() {
        return fnb;
    }

    public void setFnb(List<CheckoutFoodItem> fnb) {
        this.fnb = fnb;
    }

    public BigDecimal getGrossAmount() {
        return grossAmount;
    }

    public void setGrossAmount(BigDecimal grossAmount) {
        this.grossAmount = grossAmount;
    }
}
