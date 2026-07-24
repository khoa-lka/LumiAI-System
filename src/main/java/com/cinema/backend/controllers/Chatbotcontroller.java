package com.cinema.backend.controllers;

import com.cinema.backend.entities.Gemini;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatbotController {

    @Autowired
    private Gemini gemini;

    /**
     * API GET cũ từ ChatbotController(1).java.
     *
     * Ví dụ:
     * GET /api/chat?message=Lịch chiếu hôm nay
     *
     * Hàm askGemini(String) trả JSON tương thích với controller/frontend cũ.
     */
    @GetMapping
    public String chatWithGemini(
            @RequestParam(
                    value = "message",
                    required = false,
                    defaultValue = ""
            ) String message
    ) {
        return gemini.askGemini(
                message == null ? "" : message.trim()
        );
    }

    /**
     * API POST nâng cấp từ ChatbotController.java.
     *
     * Body:
     * {
     *   "message": "...",
     *   "history": [
     *     {"role": "user", "text": "..."},
     *     {"role": "model", "text": "..."}
     *   ]
     * }
     */
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
                    Map.of(
                            "message",
                            "Bạn chưa nhập câu hỏi."
                    )
            );
        }

        if (message.length() > 500) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "message",
                            "Câu hỏi không được quá 500 ký tự."
                    )
            );
        }

        List<Map<String, String>> history =
                new ArrayList<>();

        Object historyObject = request.get("history");

        if (historyObject instanceof List<?>) {
            for (Object item : (List<?>) historyObject) {
                if (item instanceof Map<?, ?> map) {
                    Object roleObject = map.get("role");
                    Object textObject = map.get("text");

                    String role = roleObject == null
                            ? "user"
                            : roleObject.toString().trim();

                    String text = textObject == null
                            ? ""
                            : textObject.toString().trim();

                    if (text.isEmpty()) {
                        continue;
                    }

                    history.add(
                            Map.of(
                                    "role",
                                    "model".equalsIgnoreCase(role)
                                            ? "model"
                                            : "user",
                                    "text",
                                    text
                            )
                    );
                }
            }
        }

        String reply =
                gemini.askGemini(
                        message,
                        history
                );

        return ResponseEntity.ok(
                Map.of(
                        "reply",
                        reply
                )
        );
    }
}
