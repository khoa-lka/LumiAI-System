package com.cinema.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieHistoryDTO {

    private Long movieId;
    private String title;
    private String genre;
    private Integer duration;
    private String mainposterUrl;
}
