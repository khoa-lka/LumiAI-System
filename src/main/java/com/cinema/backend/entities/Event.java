package com.cinema.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "event")
public class Event {
     @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @Column(name = "title")
    private String title; // Tên chương trình (Ví dụ: Khuyến mãi VNPAY)

    @Column(name = "image_url", nullable = false)
    private String imageUrl; // Đường dẫn ảnh trong folder: "img/vnpay-banner.jpg" hoặc link mạng

    @Column(name = "click_url")
    private String clickUrl; // Đường link dẫn đến trang bài viết ưu đãi khi khách click vào banner

    @Column(name = "position_order")
    private Integer positionOrder; // Thứ tự xuất hiện (1, 2, 3...)

    @Column(name = "active")
    private Boolean active; // Trạng thái ẩn/hiện (true/false)


        // Getters và Setters
    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long bannerId) {
        this.eventId = bannerId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getClickUrl() {
        return clickUrl;
    }

    public void setClickUrl(String clickUrl) {
        this.clickUrl = clickUrl;
    }

    public Integer getPositionOrder() {
        return positionOrder;
    }

    public void setPositionOrder(Integer positionOrder) {
        this.positionOrder = positionOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
