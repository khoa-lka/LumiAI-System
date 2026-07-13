function getLoggedUser() {
    try {
        const raw = localStorage.getItem("las_logged_in_user");
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Không đọc được thông tin đăng nhập:", error);
        return null;
    }
}

function getUserRoleId(user) {
    if (user) {
        const roleId = user.roleId ?? user.role_id ?? user.role?.roleId ?? user.role?.role_id;
        if (roleId !== undefined && roleId !== null) return Number(roleId);
    }
    const sessionRoleId = sessionStorage.getItem("roleId");
    return sessionRoleId ? Number(sessionRoleId) : null;
}

const selectedSeats = new Set();
let bookedSeats = new Set(); 
let currentSeatMap = [];
let lastOrder = null;
let selectedFoods = {}; 
let appliedVoucher = null;
let pendingCheckoutData = null;

function formatMoney(value) {
    return Number(value).toLocaleString("vi-VN") + "đ";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

window.openTab = function (tabId, button) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add("active");
    if (button) button.classList.add("active");

    const title = document.getElementById("pageTitle");
    if (tabId === "buy-ticket") title.textContent = "Mua vé tại quầy";
    else if (tabId === "print-ticket") title.textContent = "In vé";
    else if (tabId === "feedback") title.textContent = "Phản hồi khách hàng";
};

window.logout = function () {
    if (!confirm("Bạn có muốn đăng xuất khỏi hệ thống không?")) return;
    sessionStorage.clear();
    localStorage.removeItem("las_logged_in_user");
    window.location.href = "index.html";
};

// ======================= F&B & VOUCHER =======================
async function loadFood() {
    try {
        const response = await fetch('/api/pos/food');
        if (!response.ok) throw new Error("Lỗi tải F&B");
        const foods = await response.json();
        const foodList = document.getElementById("foodList");
        foodList.innerHTML = "";
        
        foods.forEach(f => {
            selectedFoods[f.foodItemId] = { id: f.foodItemId, name: f.itemName, price: f.price, qty: 0 };
            const itemDiv = document.createElement("div");
            itemDiv.className = "fb-item";
            itemDiv.innerHTML = `
                <div class="fb-info">
                    <b>${f.itemName}</b>
                    <span>${formatMoney(f.price)}</span>
                </div>
                <div class="fb-action">
                    <button type="button" onclick="changeFoodQty(${f.foodItemId}, -1)">-</button>
                    <span class="fb-qty" id="qty-${f.foodItemId}">0</span>
                    <button type="button" onclick="changeFoodQty(${f.foodItemId}, 1)">+</button>
                </div>
            `;
            foodList.appendChild(itemDiv);
        });
    } catch (error) { console.error(error); }
}

window.changeFoodQty = function(id, change) {
    const food = selectedFoods[id];
    if (!food) return;
    let newQty = food.qty + change;
    if (newQty < 0) newQty = 0;
    food.qty = newQty;
    document.getElementById(`qty-${id}`).textContent = newQty;
    updateSummary();
};

window.applyVoucher = async function() {
    const codeInput = document.getElementById("voucherInput");
    const code = codeInput.value.trim().toUpperCase();
    if (!code) { alert("Vui lòng nhập mã giảm giá."); return; }

    try {
        const response = await fetch(`/api/pos/vouchers/validate?code=${code}`);
        if (!response.ok) {
            alert(await response.text());
            appliedVoucher = null;
            updateSummary();
            return;
        }
        appliedVoucher = await response.json();
        alert("Áp dụng mã giảm giá thành công!");
        updateSummary(); 
    } catch (error) { alert("Lỗi kết nối đến máy chủ."); }
};

window.changePaymentMethod = function(radioElem) {
    document.querySelectorAll('.payment-method-card').forEach(card => card.classList.remove('active'));
    radioElem.closest('.payment-method-card').classList.add('active');
};

// ======================= SEAT & SHOWTIME =======================
async function loadMovies() {
    try {
        const response = await fetch('/api/pos/movies');
        if (!response.ok) throw new Error("Lỗi tải phim");
        const movies = await response.json();
        const movieSelect = document.getElementById("movie");
        movieSelect.innerHTML = '<option value="">Chọn phim</option>';
        movies.forEach(movie => {
            const option = document.createElement("option");
            option.value = movie.movieId || movie.movie_id || movie.id; 
            option.textContent = movie.title; 
            movieSelect.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

async function loadShowtimes() {
    const movieId = document.getElementById("movie").value;
    const date = document.getElementById("date").value;
    const showtimeContainer = document.querySelector(".showtime-list");
    bookedSeats.clear();
    drawSeatMap();
    if (!movieId || !date) {
        showtimeContainer.innerHTML = "<p style='color: #5c5c62;'>Vui lòng chọn phim và ngày chiếu.</p>";
        return;
    }

    try {
        const response = await fetch(`/api/pos/movies/${movieId}/showtimes?date=${date}`);
        if (!response.ok) throw new Error("Lỗi tải suất chiếu");
        const showtimes = await response.json();
        showtimeContainer.innerHTML = "";
        
        if (showtimes.length === 0) {
            showtimeContainer.innerHTML = "<p style='color: #ce628f;'>Không có suất chiếu nào cho ngày này.</p>";
            return;
        }

        showtimes.forEach(st => {
            const timeString = new Date(st.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "showtime-btn";
            btn.dataset.showtime = timeString;
            btn.dataset.showtimeId = st.showtimeId;
            btn.innerHTML = `<b>${timeString}</b><small>${st.roomName}</small>`;

            btn.addEventListener("click", function() {
                document.querySelectorAll(".showtime-btn").forEach(item => item.classList.remove("active"));
                btn.classList.add("active");
                document.getElementById("showtime").value = timeString;
                loadSeatMapForShowtime(st.showtimeId);
            });
            showtimeContainer.appendChild(btn);
        });
    } catch (error) { console.error(error); }
}

async function loadBookedSeats(showtimeId) {
    try {
        const response = await fetch(`/api/pos/showtimes/${showtimeId}/booked-seats`);
        const soldSeats = await response.json();
        bookedSeats.clear();
        soldSeats.forEach(seat => bookedSeats.add(seat));
        drawSeatMap();
    } catch (error) { console.error(error); }
}

async function loadSeatMapForShowtime(showtimeId) {
    try {
        const response = await fetch(`/api/pos/showtimes/${showtimeId}/seats`);
        if (!response.ok) throw new Error("Lỗi tải sơ đồ ghế");
        currentSeatMap = await response.json();
        await loadBookedSeats(showtimeId);
    } catch (error) { console.error(error); }
}

function drawSeatMap() {
    const seatMap = document.getElementById("seatMap");
    if (!seatMap) return;
    seatMap.innerHTML = "";
    updateSummary();
    if (currentSeatMap.length === 0) return;

    const maxCols = Math.max(...currentSeatMap.map(s => s.colIndex));
    seatMap.style.gridTemplateColumns = `repeat(${maxCols}, 48px)`;

    currentSeatMap.forEach(s => {
        const seatBtn = document.createElement("button");
        seatBtn.type = "button";
        seatBtn.className = "seat";
        const seatName = s.seatRow + s.seatNumber;
        seatBtn.textContent = seatName;
        seatBtn.dataset.seat = seatName;
        
        seatBtn.style.gridRow = s.rowIndex;
        seatBtn.style.gridColumn = s.colIndex;

        if (s.seatType === 'VIP') seatBtn.classList.add("vip");
        if (s.seatType === 'SWEETBOX') seatBtn.classList.add("sweetbox");

        if (bookedSeats.has(seatName)) {
            seatBtn.classList.add("booked");
            seatBtn.disabled = true;
        } else if (selectedSeats.has(seatName)) {
            seatBtn.classList.add("selected");
        }

        seatBtn.addEventListener("click", function () {
            if (seatBtn.disabled) return;
            if (selectedSeats.has(seatName)) {
                selectedSeats.delete(seatName);
                seatBtn.classList.remove("selected");
            } else {
                selectedSeats.add(seatName);
                seatBtn.classList.add("selected");
            }
            updateSummary();
        });
        seatMap.appendChild(seatBtn);
    });
}

// ======================= SUMMARY & CHECKOUT =======================
function updateSummary() {
    const seats = Array.from(selectedSeats);
    const quantity = seats.length;
    let ticketTotal = 0; let fbTotal = 0;
  
    seats.forEach(seatName => {
        const seatElement = document.querySelector(`.seat[data-seat='${seatName}']`);
        if (seatElement) {
            if (seatElement.classList.contains("vip")) ticketTotal += 110000;
            else if (seatElement.classList.contains("sweetbox")) ticketTotal += 250000;
            else ticketTotal += 90000;
        }
    });
  
    for (const key in selectedFoods) {
        if (selectedFoods[key].qty > 0) fbTotal += (selectedFoods[key].price * selectedFoods[key].qty);
    }
  
    let discountAmount = 0;
    let tempTotal = ticketTotal + fbTotal; 
  
    if (appliedVoucher) {
        const minOrder = appliedVoucher.minimumOrder || appliedVoucher.minimum_order || 0;
        const type = appliedVoucher.discountType || appliedVoucher.discount_type;
        const value = appliedVoucher.discountValue || appliedVoucher.discount_value || 0;
        const maxDiscount = appliedVoucher.maxDiscount || appliedVoucher.max_discount;
  
        if (tempTotal >= minOrder) {
            if (type === 'PERCENT') {
                discountAmount = tempTotal * (value / 100);
                if (maxDiscount && discountAmount > maxDiscount) discountAmount = maxDiscount;
            } else if (type === 'FIXED') {
                discountAmount = value;
            }
        } else {
            alert(`Mã giảm giá yêu cầu đơn tối thiểu ${formatMoney(minOrder)}.`);
            appliedVoucher = null; document.getElementById("voucherInput").value = "";
        }
    }
  
    let finalTotal = tempTotal - discountAmount;
    if (finalTotal < 0) finalTotal = 0; 
  
    setText("ticketQuantity", quantity);
    setText("selectedSeats", quantity ? seats.join(", ") : "Chưa chọn ghế");
    setText("subtotalPrice", formatMoney(tempTotal));               
    setText("discountPrice", "-" + formatMoney(discountAmount));     
    setText("totalPrice", formatMoney(finalTotal));                  
}

window.createOrder = async function () {
    const movie = document.getElementById("movie").value;
    const date = document.getElementById("date").value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    const activeShowtimeBtn = document.querySelector(".showtime-btn.active");
    const showtimeId = activeShowtimeBtn ? activeShowtimeBtn.dataset.showtimeId : null;
    const seats = Array.from(selectedSeats);

    if (!movie || !date || !showtimeId) { alert("Vui lòng chọn đầy đủ Phim, Ngày và Suất chiếu."); return; }
    if (seats.length === 0) { alert("Vui lòng chọn ít nhất một ghế để tiếp tục."); return; }

    const foodItems = [];
    for (const key in selectedFoods) {
        if (selectedFoods[key].qty > 0) {
            foodItems.push({
                foodItemId: selectedFoods[key].id, quantity: selectedFoods[key].qty, subtotal: selectedFoods[key].price * selectedFoods[key].qty
            });
        }
    }

    const totalAmount = Number(document.getElementById("totalPrice").textContent.replace(/\D/g, ""));
    const loggedUser = getLoggedUser();
    const staffId = loggedUser ? (loggedUser.accountId || loggedUser.id || 1) : 1;

    pendingCheckoutData = {
        showtimeId: Number(showtimeId), seats: seats, foodItems: foodItems,
        totalAmount: totalAmount, staffId: staffId, paymentMethod: paymentMethod,
        voucherId: appliedVoucher ? appliedVoucher.voucherId : null 
    };

    if (paymentMethod === 'CASH' || totalAmount === 0) {
        executeCheckoutAPI();
    } else if (paymentMethod === 'VNPAY') {
        try {
            document.getElementById('qrTitle').textContent = "Đang tạo mã VNPAY...";
            document.getElementById('qrModal').style.display = 'flex';
            const response = await fetch(`/api/pos/vnpay/create-url?amount=${totalAmount}`);
            showQRModal(totalAmount, 'VNPAY', await response.text());
        } catch (error) { alert("Lỗi kết nối đến VNPAY!"); closeQRModal(); }
    } else {
        showQRModal(totalAmount, 'VIETQR');
    }
};

function showQRModal(amount, method, customUrl = null) {
    const modal = document.getElementById('qrModal');
    const qrImage = document.getElementById('qrImage');
    document.getElementById('qrAmountDisplay').textContent = formatMoney(amount);
    
    if (method === 'VNPAY') {
        document.getElementById('qrTitle').textContent = "Thanh toán Cổng VNPAY";
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(customUrl)}`;
    } else if (method === 'VIETQR') {
        document.getElementById('qrTitle').textContent = "Chuyển khoản QR Quốc Gia";
        const BANK_BIN = "970422"; const ACCOUNT_NO = "0123456789"; const ACCOUNT_NAME = "CINEMA LUMI AI";
        qrImage.src = `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=Thanh toan ve phim&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
    }
    modal.style.display = 'flex';
}

window.closeQRModal = function() { document.getElementById('qrModal').style.display = 'none'; }
window.confirmQRPayment = function() { closeQRModal(); executeCheckoutAPI(); }

async function executeCheckoutAPI() {
    try {
        const response = await fetch('/api/pos/checkout', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pendingCheckoutData)
        });
        if (!response.ok) throw new Error(await response.text());
        const orderCode = await response.text();
        
        // 1. Lấy dữ liệu tên phim, ngày, giờ từ HTML
        const movieSelect = document.getElementById("movie");
        const movieName = movieSelect.options[movieSelect.selectedIndex].text;
        const date = document.getElementById("date").value;
        const time = document.getElementById("showtime").value;
        const seats = Array.from(selectedSeats);
        const totalPaid = pendingCheckoutData.totalAmount;
        const orderInfoForPrint = {
    orderCode: orderCode,
    movie: document.getElementById("movie").options[document.getElementById("movie").selectedIndex].text,
    date: document.getElementById("date").value,
    showtime: document.getElementById("showtime").value,
    seats: Array.from(selectedSeats),
    ticketCode: "TIX-" + orderCode // Giả định ticketCode theo mã đơn để hiển thị
};
localStorage.setItem("las_last_pos_order", JSON.stringify(orderInfoForPrint));
        // 2. Mở Popup Vé Thành Công
        showTicketSuccessModal(orderCode, movieName, date, time, seats, selectedFoods, totalPaid);

        // 3. Xóa trắng giỏ hàng (Để sẵn sàng cho khách tiếp theo)
        selectedSeats.clear();
        for (const key in selectedFoods) { selectedFoods[key].qty = 0; document.getElementById(`qty-${key}`).textContent = 0; }
        appliedVoucher = null; document.getElementById("voucherInput").value = "";
        
        const activeShowtimeBtn = document.querySelector(".showtime-btn.active");
        if (activeShowtimeBtn) loadSeatMapForShowtime(activeShowtimeBtn.dataset.showtimeId);
        else drawSeatMap(); 
        
        updateSummary(); 
    } catch (error) { 
        alert("Thanh toán thất bại: " + error.message); 
    }
}
function showTicketSuccessModal(orderCode, movieName, date, time, seats, foodsObj, totalPaid) {
    document.getElementById("successMovieName").textContent = movieName;
    document.getElementById("successDate").textContent = date;
    document.getElementById("successTime").textContent = time;
    document.getElementById("successSeatCount").textContent = seats.length;
    
    // Nạp danh sách ghế
    const seatsContainer = document.getElementById("successSeats");
    seatsContainer.innerHTML = seats.map(s => `<span class="seat-badge">${s}</span>`).join('');
    
    // Nạp danh sách Bắp nước
    const foodsContainer = document.getElementById("successFoodList");
    const foodArr = [];
    for (const k in foodsObj) {
        if (foodsObj[k].qty > 0) foodArr.push(`${foodsObj[k].name} (x${foodsObj[k].qty})`);
    }
    if (foodArr.length === 0) {
        foodsContainer.innerHTML = `<li>Không có</li>`;
    } else {
        foodsContainer.innerHTML = foodArr.map(f => `<li>${f}</li>`).join('');
    }
    
    // Nạp mã đơn, giá tiền và vẽ mã QR bằng API
    document.getElementById("successOrderCode").textContent = orderCode;
    document.getElementById("successTotalPaid").textContent = formatMoney(totalPaid);
    document.getElementById("successQrImg").src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderCode)}`;
    
    // Bật Popup
    document.getElementById("ticketSuccessModal").style.display = 'flex';
}

// Hàm tắt Popup Vé khi nhân viên bấm "Về trang chủ"
window.closeTicketSuccessModal = function() {
    document.getElementById("ticketSuccessModal").style.display = 'none';
}
// ======================= TOOLS (SEARCH, FEEDBACK) =======================
window.searchTicket = function () {
    const keyword = document.getElementById("ticketSearch").value.trim();
    const savedOrderRaw = localStorage.getItem("las_last_pos_order");
    
    // Tìm các phần tử hiển thị kết quả
    const ticketResult = document.getElementById("ticketResult");
    
    // 1. Nếu chưa có đơn hàng nào từng mua, báo lỗi luôn
    if (!savedOrderRaw) {
        alert("Chưa có giao dịch nào được lưu trên máy này.");
        return;
    }

    const lastOrder = JSON.parse(savedOrderRaw);
    
    // 2. So sánh mã đơn hàng
    if (lastOrder.orderCode === keyword) {
        // Nếu tìm thấy: hiển thị thông tin
        setText("resultOrderCode", lastOrder.orderCode);
        setText("resultTicketCode", lastOrder.ticketCode || "N/A");
        setText("resultMovie", lastOrder.movie);
        setText("resultShowtime", lastOrder.showtime + " - " + lastOrder.date);
        setText("resultSeats", lastOrder.seats.join(", "));
        ticketResult.classList.add("show");
    } else {
        // 3. Nếu KHÔNG tìm thấy: xóa kết quả cũ và báo lỗi
        ticketResult.classList.remove("show"); // Ẩn vé cũ đi
        alert("Mã vé hoặc mã đơn hàng không tồn tại trong phiên làm việc này. Vui lòng kiểm tra lại!");
    }
};
window.printTicket = function () {
    if (!document.getElementById("ticketResult").classList.contains("show")) {
        alert("Vui lòng tìm vé trước khi in."); return;
    }
    window.print();
};

window.replyFeedback = async function (textareaId, statusId) {
  const content = document.getElementById(textareaId).value.trim();
  if (!content) { alert("Vui lòng nhập nội dung."); return; }

  const loggedUser = getLoggedUser();
  // Đảm bảo account_staff_id được gửi đúng tên biến mà Entity của bạn quy định
  const feedbackData = {
      content: content,
      title: "Đánh giá từ nhân viên", // Bạn có thể sửa thành title thực tế
      ratingStars: 5, // Có thể làm thêm ô nhập sao nếu muốn
      accountStaffId: loggedUser ? (loggedUser.accountId || 1) : 1,
      createdAt: new Date().toISOString() // Định dạng chuẩn cho Java
  };

  try {
      const response = await fetch('/api/pos/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackData)
      });
      if (response.ok) {
          alert("Gửi thành công!");
          document.getElementById(textareaId).value = "";
          loadFeedbacks(); // Tự động load lại danh sách phản hồi mới nhất
      } else {
          alert("Lỗi: " + await response.text());
      }
  } catch (error) {
      alert("Lỗi kết nối server.");
  }
};

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", function () {
    const loggedUser = getLoggedUser();
    if (!loggedUser) {
        alert("Vui lòng đăng nhập để truy cập máy POS.");
        window.location.replace("index.html");
        return;
    }
    const userRoleId = getUserRoleId(loggedUser);
    if (userRoleId !== 2) {
        alert("Chỉ tài khoản Staff mới được truy cập máy POS.");
        window.location.replace("index.html");
        return;
    }
    const fullName = loggedUser.fullName || loggedUser.name || loggedUser.username || "Nhân viên";
    setText("pageTitle", "Xin chào, " + fullName + " 👋");
    setText("staffName", fullName);

    document.getElementById("movie").addEventListener("change", loadShowtimes);

    document.querySelectorAll(".date-btn").forEach(function (button) {
        button.addEventListener("click", function () {
            document.querySelectorAll(".date-btn").forEach(item => item.classList.remove("active"));
            button.classList.add("active");
            document.getElementById("date").value = button.dataset.date;
            loadShowtimes();
        });
    });
    loadFeedbacks();
    renderDates();
    loadMovies();
    drawSeatMap();
    loadFood();
});

// Hàm tự động sinh 14 ngày chiếu kể từ hôm nay
function renderDates() {
    const container = document.getElementById("dateListContainer");
    if (!container) return;
    container.innerHTML = "";

    const today = new Date();
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    for (let i = 0; i < 14; i++) { 
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Chuẩn hóa ngày tháng năm (YYYY-MM-DD) để gửi xuống API
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;

        // Chuẩn hóa hiển thị (T6, 10, Th07)
        const dow = dayNames[d.getDay()];
        const day = d.getDate();
        const month = `Th${String(d.getMonth() + 1).padStart(2, '0')}`;

        // Tạo nút bấm
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `date-btn ${i === 0 ? 'active' : ''}`;
        btn.dataset.date = dateString;
        btn.innerHTML = `<span class="dow">${dow}</span><span class="day">${day}</span><span class="month">${month}</span>`;

        // Bắt sự kiện click
        btn.addEventListener("click", function () {
            document.querySelectorAll(".date-btn").forEach(item => item.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById("date").value = dateString;
            
            loadShowtimes(); // Gọi API load suất chiếu khi đổi ngày
        });

        container.appendChild(btn);
    }

    // Gán value mặc định cho ô input ẩn là ngày hôm nay
    const fY = today.getFullYear();
    const fM = String(today.getMonth() + 1).padStart(2, '0');
    const fD = String(today.getDate()).padStart(2, '0');
    document.getElementById("date").value = `${fY}-${fM}-${fD}`;
}

// Hàm load danh sách phản hồi từ DB
// Hàm load danh sách phản hồi từ DB
async function loadFeedbacks() {
    try {
        const response = await fetch('/api/pos/feedbacks');
        const feedbacks = await response.json();
        const fbList = document.getElementById("feedbackList");
        if (!fbList) return;
        fbList.innerHTML = "";

        const parents = feedbacks.filter(fb => !fb.title.includes("Phản hồi"));
        const replies = feedbacks.filter(fb => fb.title.includes("Phản hồi"));

        parents.forEach(p => {
            const myReplies = replies.filter(r => r.title.includes(`ID: ${p.feedbackId}`));
            const div = document.createElement("div");
            div.className = "fb-item";
            div.style = "background:#1c1c1f; padding:20px; margin-bottom:20px; border-radius:12px; border:1px solid #303036;";
            
            div.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <b style="color:#f0713b;">👤 Khách: ${p.title}</b>
                    <p style="color:#fff; margin:5px 0;">${p.content}</p>
                    <span style="color:#d4aa42; font-size:12px;">Đánh giá: ${p.ratingStars || 5} ⭐</span>
                </div>
                <div class="replies-container" style="border-top:1px solid #3b3b42; margin-top:10px; padding-top:10px;">
                    ${myReplies.map(r => `
                        <div style="background:#26262b; padding:8px; border-radius:5px; margin-bottom:5px;">
                          <small style="color:#a6a6ae; font-style:italic;">↳ Nhân viên: ${r.content.replace('Phản hồi: ', '')}</small>
                        </div>
                    `).join('')}
                </div>
                <div class="reply-area" style="display:flex; gap:10px; margin-top:10px;">
                    <button class="reply-btn" onclick="openReplyModal(${p.feedbackId}, '${p.title}')" style="background:#e26735; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Phản hồi</button>
                </div>
            `;
            fbList.appendChild(div);
        });
    } catch (e) { console.error(e); }
}

// Hàm phản hồi riêng biệt
window.replySpecificFeedback = async function (feedbackId) {
    const content = document.getElementById(`reply-${feedbackId}`).value.trim();
    if (!content) { alert("Vui lòng nhập nội dung phản hồi!"); return; }

    const loggedUser = getLoggedUser();
    try {
        const response = await fetch('/api/pos/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                content: "Phản hồi: " + content, 
                title: "Phản hồi cho feedback ID: " + feedbackId,
                ratingStars: 5,
                accountStaffId: loggedUser ? (loggedUser.accountId || 1) : 1
            })
        });

        if (response.ok) {
            alert("Đã gửi phản hồi thành công!");
            loadFeedbacks();
        } else {
            alert("Lỗi khi gửi phản hồi.");
        }
    } catch (error) {
        alert("Lỗi kết nối server.");
    }
};
// Mở popup
window.openReplyModal = function(feedbackId, customerName) {
    document.getElementById("modalFeedbackId").value = feedbackId;
    document.getElementById("replyTargetInfo").textContent = "Phản hồi cho: " + customerName;
    document.getElementById("modalReplyText").value = ""; // Xóa trắng ô nhập cũ
    document.getElementById("replyModal").style.display = "flex";
};

// Đóng popup
window.closeModal = function() {
    const modal = document.getElementById("replyModal");
    if (modal) {
        modal.style.display = "none";
    } else {
        console.warn("Không tìm thấy phần tử replyModal");
    }
};

// Gửi phản hồi từ popup
window.submitModalReply = async function() {
    const feedbackId = document.getElementById("modalFeedbackId").value;
    const content = document.getElementById("modalReplyText").value.trim();
    
    if (!content) { alert("Vui lòng nhập nội dung!"); return; }
    
    // Gọi API (tương tự như hàm replySpecificFeedback cũ của bạn)
    const response = await fetch('/api/pos/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: "Phản hồi: " + content,
            title: "Phản hồi cho feedback ID: " + feedbackId,
            ratingStars: 5,
            accountStaffId: 1
        })
    });

    if (response.ok) {
        alert("Gửi thành công!");
        document.getElementById("modalReplyText").value = "";
        closeModal();
        loadFeedbacks(); // Load lại danh sách
    }
};