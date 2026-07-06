package com.cinema.backend.controllers;

import com.cinema.backend.entities.FoodBeverage;
import com.cinema.backend.repositories.FoodBeverageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fnb")
@CrossOrigin(origins = "*")
public class FoodBeverageController {

    @Autowired
    private FoodBeverageRepository fnbRepository;

    // 1. GET ALL
    @GetMapping
    public List<FoodBeverage> getAllItems() {
        return fnbRepository.findAll();
    }

    // 2. CREATE
    @PostMapping
    public FoodBeverage createItem(@RequestBody FoodBeverage item) {
        return fnbRepository.save(item);
    }

    // 3. UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<FoodBeverage> updateItem(@PathVariable Integer id, @RequestBody FoodBeverage itemDetails) {
        return fnbRepository.findById(id).map(item -> {
            item.setItemName(itemDetails.getItemName());
            item.setPrice(itemDetails.getPrice());
            item.setStockQuantity(itemDetails.getStockQuantity());
            return ResponseEntity.ok(fnbRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 4. DELETE 
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Integer id) {
        if (fnbRepository.existsById(id)) {
            fnbRepository.deleteById(id);
            return ResponseEntity.ok().build(); // Trả về 200 OK trống trơn sạch sẽ
        } else {
            return ResponseEntity.notFound().build(); // Trả về 404 Not Found nếu không có ID
        }
    }
}