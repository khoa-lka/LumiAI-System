package com.cinema.backend.repositories;

import com.cinema.backend.entities.SysLogDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SysLogRepository extends JpaRepository<SysLogDTO, Long> {

    // 1. Lấy tất cả logs và sắp xếp theo ID giảm dần (mới nhất lên đầu)
    // Nếu bạn muốn sắp xếp theo thời gian, hãy đổi thành findByOrderByTimeDesc()
    List<SysLogDTO> findAllByOrderByIdDesc();

    // 2. Tìm log theo tên người dùng (hữu ích nếu Admin muốn lọc log của 1 tài khoản)
    List<SysLogDTO> findByUserIgnoreCase(String user);

    // 3. Tìm log theo trạng thái (ví dụ: tìm tất cả các log bị 'FAILED')
    List<SysLogDTO> findByStatus(String status);
}