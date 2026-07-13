package com.cinema.backend.dto;

import java.util.List;

// DTO riêng cho luồng checkout tại quầy (Máy POS của Staff) — khác với
// entities.CheckoutRequest đang dùng cho luồng đặt vé online, để tránh
// đụng hàng/thay đổi luồng online hiện có.
public class CheckoutRequest {
    private Integer showtimeId;
    private List<String> seats;
    private List<FoodItemRequest> foodItems; // Hứng danh sách bắp nước
    private Double totalAmount;
    private Integer staffId;
    private String paymentMethod; // Hứng phương thức thanh toán
    private Integer voucherId;

    // Getters and Setters
    public Integer getShowtimeId() { return showtimeId; }
    public void setShowtimeId(Integer showtimeId) { this.showtimeId = showtimeId; }
    public List<String> getSeats() { return seats; }
    public void setSeats(List<String> seats) { this.seats = seats; }
    public List<FoodItemRequest> getFoodItems() { return foodItems; }
    public void setFoodItems(List<FoodItemRequest> foodItems) { this.foodItems = foodItems; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public Integer getStaffId() { return staffId; }
    public void setStaffId(Integer staffId) { this.staffId = staffId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public Integer getVoucherId() { return voucherId; }
    public void setVoucherId(Integer voucherId) { this.voucherId = voucherId; }

    // Class con dành cho từng món bắp nước
    public static class FoodItemRequest {
        private Integer foodItemId;
        private Integer quantity;
        private Double subtotal;

        public Integer getFoodItemId() { return foodItemId; }
        public void setFoodItemId(Integer foodItemId) { this.foodItemId = foodItemId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Double getSubtotal() { return subtotal; }
        public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    }
}