package com.cinema.backend.controllers;

import com.cinema.backend.entities.Gemini;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatbotController {

    @Autowired
    private Gemini gemini;

    @SuppressWarnings("unchecked")
    @PostMapping
    public ResponseEntity<?> chatWithGemini(
            @RequestBody Map<String, Object> request
    ) {
        String message = request.get("message") == null
                ? ""
                : request.get("message").toString().trim();

        if (message.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Bạn chưa nhập câu hỏi.")
            );
        }

        if (message.length() > 500) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Câu hỏi không được quá 500 ký tự.")
            );
        }

        List<Map<String, String>> history = new ArrayList<>();

        Object historyObject = request.get("history");

        if (historyObject instanceof List<?>) {
            for (Object item : (List<?>) historyObject) {
                if (item instanceof Map<?, ?> map) {
                    String role = String.valueOf(map.get("role"));
                    String text = String.valueOf(map.get("text"));

                    history.add(Map.of(
                            "role", role,
                            "text", text
                    ));
                }
            }
        }

        String reply = gemini.askGemini(message, history);

        return ResponseEntity.ok(Map.of("reply", reply));
    }
}