package com.cinema.backend.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public class CurrentUser {

    // Lấy accountId của người đang đăng nhập (đọc từ JWT), null nếu chưa đăng nhập
    public static Integer getId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        try {
            return Integer.parseInt(auth.getName());
        } catch (Exception e) {
            return null;
        }
    }

    // true nếu người đang đăng nhập có quyền ADMIN
    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        for (GrantedAuthority a : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equals(a.getAuthority())) return true;
        }
        return false;
    }

    // true nếu người đang đăng nhập ĐƯỢC PHÉP xem dữ liệu của accountId này
    // (chính chủ, hoặc là ADMIN)
    public static boolean canAccess(Integer accountId) {
        if (isAdmin()) return true;
        Integer myId = getId();
        return myId != null && myId.equals(accountId);
    }
}