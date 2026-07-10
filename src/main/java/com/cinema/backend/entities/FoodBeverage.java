package com.cinema.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "foodbeverage")
@Data
public class FoodBeverage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "food_item_id")
    private Integer foodItemId;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    @JsonIgnore
    @OneToMany(mappedBy = "foodItem")
    private List<OrderDetail> orderDetails;
}