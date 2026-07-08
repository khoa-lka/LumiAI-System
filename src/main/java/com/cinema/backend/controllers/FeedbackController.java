package com.cinema.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.web.bind.annotation.*;
import com.cinema.backend.entities.Feedback;
import com.cinema.backend.repositories.FeedbackRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin("*")
public class FeedbackController {
    @Autowired private FeedbackRepository repo;

   @PostMapping("/submit")
public Map<String, Object> submit(@RequestBody Feedback fb) {

    fb.setCreatedAt(LocalDateTime.now());

    repo.save(fb);

    return Map.of("success", true);
}

   @GetMapping("/movie/{movieId}")
public List<Map<String,Object>> getByMovie(@PathVariable Integer movieId){

    List<Object[]> rows = repo.getFeedbackWithUser(movieId);

    List<Map<String,Object>> result = new ArrayList<>();

    for(Object[] r : rows){

        Map<String,Object> item = new HashMap<>();

        item.put("feedbackId", r[0]);

        item.put("title", r[1]);

        item.put("content", r[2]);

        item.put("ratingStars", r[3]);

        item.put("movieId", r[4]);

        item.put("accountStaffId", r[5]);

        item.put("createdAt", r[6]);

        item.put("accountName", r[7]);

        result.add(item);
    }

    return result;
}
}