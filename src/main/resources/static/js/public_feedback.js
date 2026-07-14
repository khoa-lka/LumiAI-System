async function loadPublicFeedbacks() {
    try {
        const [fbRes, movieRes] = await Promise.all([
            fetch('/api/pos/feedbacks').then(res => res.json()),
            fetch('/api/movies').then(res => res.json())
        ]);

        const fbList = document.getElementById("publicFeedbackList");
        if (!fbList) return;
        fbList.innerHTML = "";

        // Gom nhóm theo phim
        const grouped = fbRes.reduce((acc, fb) => {
            if (fb.title.includes("Phản hồi")) return acc;
            const mId = fb.movieId;
            if (!acc[mId]) acc[mId] = [];
            acc[mId].push(fb);
            return acc;
        }, {});

        Object.keys(grouped).forEach(movieId => {
            const movie = movieRes.find(m => (m.movieId || m.id) == movieId);
            const movieName = movie ? movie.title : "Phim không xác định";

            const section = document.createElement("div");
            section.innerHTML = `<h3 style="color: #f0713b;">🎬 PHIM: ${movieName}</h3>`;
            
            grouped[movieId].forEach(p => {
                const div = document.createElement("div");
                div.className = "fb-review-card";
                div.innerHTML = `<p><b>${p.title}:</b> ${p.content}</p>`;
                section.appendChild(div);
            });
            fbList.appendChild(section);
        });
    } catch (e) { console.error(e); }
}
// Trong public_feedback.js
async function loadPublicFeedbacksForMovie(movieId) {
    try {
        // Chỉ lấy feedback của đúng phim này
        const response = await fetch(`/api/feedback/movie/${movieId}`);
        const feedbacks = await response.json();

        const container = document.getElementById("publicFeedbackList");
        if (!container) return;

        container.innerHTML = "";
        if (feedbacks.length === 0) {
            container.innerHTML = "<p style='color:#a6a6ae;'>Chưa có đánh giá nào cho phim này.</p>";
            return;
        }

        // Đã bổ sung code render giao diện
        feedbacks.forEach(fb => {
            const div = document.createElement("div");
            div.className = "fb-review-card";
            div.innerHTML = `
                <div class="fb-review-head">
                    <b class="fb-review-name">Khách: ${fb.title || 'Ẩn danh'}</b>
                    <div class="fb-review-stars">${'★'.repeat(fb.ratingStars || 5)}</div>
                </div>
                <p class="fb-review-content">${fb.content}</p>
            `;
            container.appendChild(div);
        });
    } catch (e) { console.error("Lỗi:", e); }
}
// Thay vì đặt trong file chung, hãy đặt ở cuối file public_feedback.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Đang khởi chạy loadPublicFeedbacks...");
    loadPublicFeedbacks();
});