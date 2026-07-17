async function loadPublicFeedbacks() {
    try {
        console.log("Bắt đầu load feedback...");
        const [feedbacks, movies] = await Promise.all([
            fetch("/api/feedback/public-all").then(r => r.json()),
            fetch("/api/movies").then(r => r.json())
        ]);

        console.log("Feedback:", feedbacks);
        console.log("Movies:", movies);

        const container = document.getElementById("feedback-list-container");
        if (!container) {
            console.error("Không tìm thấy feedback-list-container");
            return;
        }

        container.innerHTML = "";
        // Thêm class lưới chuẩn cho container
        container.classList.add("fb-review-grid");

        const grouped = {};
        feedbacks.forEach(fb => {
            if (!grouped[fb.movieId]) {
                grouped[fb.movieId] = [];
            }
            grouped[fb.movieId].push(fb);
        });

        console.log(grouped);

        Object.keys(grouped).forEach(movieId => {
            const movie = movies.find(m => (m.movieId || m.id) == movieId);
            console.log("Movie:", movie);

            const section = document.createElement("div");
            // Section này nên chiếm hết chiều rộng lưới
            section.style.gridColumn = "1 / -1";
            section.style.marginBottom = "20px";

            section.innerHTML = `
                <h3 style="color: var(--cgv-red); margin-bottom: 15px;">🎬 ${movie ? movie.title : "Không tìm thấy phim"}</h3>
            `;

            grouped[movieId].forEach(fb => {
                // Tạo thẻ review theo cấu trúc chuẩn
                const reviewCard = generateStandardFeedbackCard(fb);
                section.appendChild(reviewCard);
            });

            container.appendChild(section);
        });

    } catch (e) {
        console.error(e);
    }
}

async function loadAverageRating(movieId) {
    console.log("==== loadAverageRating ====");
    console.log("movieId:", movieId);
    try {
        const res = await fetch(`/api/feedback/movie/${movieId}/average`);
        const data = await res.json();
        console.log("API trả về:", data);
        const badge = document.getElementById("feedback-average-box");
        console.log("badge:", badge);
        if (badge) {
            // Sử dụng định dạng text chuẩn: icon sao, điểm, /5
            badge.innerHTML = `⭐ ${Number(data.average).toFixed(1)} / 5`;
            console.log("Đã cập nhật:", badge.textContent);
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadPublicFeedbacksForMovie(movieId){
   try {
        const feedbacks = await fetch(`/api/feedback/movie/${movieId}`).then(r=>r.json());
        await loadAverageRating(movieId);

        const container = document.getElementById("feedback-list-container");
        if(!container) return;

        container.innerHTML="";
        // Thêm class lưới chuẩn cho container
        container.classList.add("fb-review-grid");

        if(feedbacks.length == 0){
            // Sử dụng class thông báo trống chuẩn
            container.innerHTML = `<div class="fb-review-empty" style="grid-column: 1/-1; text-align: center;">Chưa có đánh giá nào cho bộ phim này.</div>`;
            return;
        }

        feedbacks.forEach(fb => {
            // Sử dụng hàm chung để tạo thẻ review theo cấu trúc chuẩn
            const reviewCard = generateStandardFeedbackCard(fb);
            container.appendChild(reviewCard);
        });
    }
    catch(e){
        console.error(e);
    }
}

/**
 * Hàm hỗ trợ tạo thẻ Feedback (Review Card) theo cấu trúc chuẩn
 * Khớp hoàn toàn với CSS trong .fb-review-card, .fb-review-head, v.v.
 */
function generateStandardFeedbackCard(fb) {
    const div = document.createElement("div");
    div.className = "fb-review-card";

    // Xử lý tên: lấy họ tên hoặc tiêu đề, mặc định là "Ẩn danh"
    const displayName = fb.accountName || fb.title || "Ẩn danh";
    
    // Tạo Avatar viết tắt (ví dụ: "Nguyễn Văn A" -> "NA")
    const initials = displayName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    
    // Tạo màu nền ngẫu nhiên cho avatar dựa trên tên
    const avatarColor = stringToColor(displayName);

    // Xử lý ngày tháng: chuyển đổi định dạng ISO từ DB sang định dạng VN
    let formattedDate = "";
    if (fb.createdAt) {
        try {
            const dateObj = new Date(fb.createdAt);
            formattedDate = dateObj.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (e) { formattedDate = fb.createdAt; }
    } else { formattedDate = "Gần đây"; }

    // Số sao (mặc định là 5 nếu không có)
    const stars = fb.ratingStars || 5;

    // Bố cục HTML chuẩn theo CSS cung cấp
    div.innerHTML = `
        <div class="fb-review-head">
            <div class="fb-review-avatar" style="background-color: ${avatarColor};">
                ${initials}
            </div>
            <div class="fb-review-headtext">
                <span class="fb-review-name">${displayName}</span>
                <span class="fb-review-date">${formattedDate}</span>
            </div>
            <div class="fb-review-rating">
                ⭐ ${stars.toFixed(1)}
            </div>
        </div>
        <p class="fb-review-text">
            ${fb.content}
        </p>
    `;
    return div;
}

/**
 * Hàm hỗ trợ tạo màu nền ngẫu nhiên ổn định dựa trên chuỗi tên
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

// document.addEventListener("DOMContentLoaded", () => {
//     // Lấy movieId từ URL params hoặc một biến toàn cục nào đó của phim đang xem
//     const urlParams = new URLSearchParams(window.location.search);
//     const movieId = urlParams.get('movieId') || 1; // Giả sử ID mặc định

//     // Gọi hàm chi tiết phim thay vì hàm tổng hợp
//     loadPublicFeedbacksForMovie(movieId); 
// });
