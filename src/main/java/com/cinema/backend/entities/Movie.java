package com.cinema.backend.entities;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
// -> Nhãn này bảo với Spring: "Hãy biến Class này thành thực thể kết nối Database nhé!"
@Table(name = "movie")
// -> Nhãn này bảo với Spring: "Hãy liên kết Class này trực tiếp với bảng dữ liệu có tên là movie dưới SQL Server!"
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // -> Nhãn này ra lệnh: "Khi chèn phim mới, hãy tự động tăng ID (1, 2, 3...) giống như thuộc tính IDENTITY(1,1) dưới SQL Server, tôi không muốn nhập tay!"
    @Column(name = "movie_id")
    // -> Nhãn này đánh dấu: "Cột ngay phía dưới chính là khóa chính (Primary Key) của bảng!"
    private Long movieId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "genre")
    private String genre;

    @Column(name = "duration")
    private Integer duration;

    @Column(name = "synopsis")
    private String synopsis;

    @Column(name = "mainposter_url")
    private String mainposterUrl;

    @Column(name = "subposter_url")
    private String subposterUrl;

    @Column(name = "director")
    private String director;

    @Column(name = "country")
    private String country;

    @Column(name = "performer")
    private String performer;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "rating")
    private Double rating;

    @Column(name = "status")
    private String status;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "updated_by")
    private Integer updatedBy;

    
    public Long getMovieId() {
        return movieId;
    }

    public void setMovieId(Long movieId) {
        this.movieId = movieId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public String getSynopsis() {
        return synopsis;
    }

    public void setSynopsis(String synopsis) {
        this.synopsis = synopsis;
    }

    public String getMainposterUrl() {
        return mainposterUrl;
    }

    public void setMainposterUrl(String mainposterUrl) {
        this.mainposterUrl = mainposterUrl;
    }

    public String getSubposterUrl() {
        return subposterUrl;
    }

    public void setSubposterUrl(String subposterUrl) {
        this.subposterUrl = subposterUrl;
    }

    public String getDirector() {
        return director;
    }

    public void setDirector(String director) {
        this.director = director;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPerformer() {
        return performer;
    }

    public void setPerformer(String performer) {
        this.performer = performer;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDate releaseDate) {
        this.releaseDate = releaseDate;
    }

    public Double getRating() {
        return rating;
    }

    public void setRating(Double rating) {
        this.rating = rating;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Integer createdBy) {
        this.createdBy = createdBy;
    }

    public Integer getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Integer updatedBy) {
        this.updatedBy = updatedBy;
    }
}
