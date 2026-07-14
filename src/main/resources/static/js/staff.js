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

// Popup xác nhận đăng xuất (thay cho confirm() mặc định của trình duyệt) —
// theo bản chỉnh sửa của bạn cùng nhóm.
window.logout = function () {
    document.getElementById("confirmModal").style.display = "flex";
};
window.closeConfirmModal = function() {
    document.getElementById("confirmModal").style.display = "none";
};
window.executeLogout = function() {
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

    // Đồng bộ y hệt cách chia lưới ghế của luồng khách hàng (xem js/ui.js
    // renderCgvInterface): phòng nhiều cột (IMAX) thì thu nhỏ ghế + gap lại.
    const maxCols = Math.max(...currentSeatMap.map(s => s.colIndex));
    const isImaxRoom = maxCols > 10;
    seatMap.style.display = "grid";
    seatMap.style.gridTemplateColumns = `repeat(${maxCols}, 1fr)`;
    seatMap.style.gap = isImaxRoom ? "4px" : "6px";
    seatMap.classList.toggle("imax-room", isImaxRoom);

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

    if (!movie || !date || !showtimeId) { showToast("Vui lòng chọn đầy đủ Phim, Ngày và Suất chiếu.", false); return; }
    if (seats.length === 0) { showToast("Vui lòng chọn ít nhất một ghế để tiếp tục.", false); return; }

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
    } else {
        startVietQRPayOSFlow(totalAmount);
    }
};

let qrCountdownInterval = null;
let staffPayOSOrderCode = null;
let staffQrPollInterval = null;
let staffQrPollErrorCount = 0;

function setStepTexts(t1, d1, t2, d2, t3, d3) {
    setText("qrStep1Title", t1); setText("qrStep1Desc", d1);
    setText("qrStep2Title", t2); setText("qrStep2Desc", d2);
    setText("qrStep3Title", t3); setText("qrStep3Desc", d3);
}

// Đếm ngược 15:00 giống hệt luồng khách hàng (vietqr-timer).
function startQrCountdown(seconds) {
    if (qrCountdownInterval) clearInterval(qrCountdownInterval);
    let remaining = seconds;
    const render = () => {
        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        setText("qrCountdown", `${m}:${s}`);
    };
    render();
    qrCountdownInterval = setInterval(() => {
        remaining--;
        if (remaining < 0) { clearInterval(qrCountdownInterval); return; }
        render();
    }, 1000);
}

// ======================= VIETQR (PayOS thật) =======================
// Dùng đúng API PayOS mà luồng khách hàng (booking.js: API.createPayOSPayment /
// API.getQrPaymentStatus) đang gọi — /api/payment/payos/create + /api/payment/qr/status/{orderCode}
// (là các endpoint chung trong PaymentController, không gắn với session khách hàng nên
// POS gọi thẳng được). Nhờ vậy mã QR là thật (Napas thật, đúng số tiền) và có thể tự
// nhận diện thanh toán qua webhook giống hệt bên khách hàng — nếu server public/webhook
// không tới được (ví dụ chạy localhost khi test), nhân viên vẫn bấm nút xác nhận thủ công
// như bình thường, không bị chặn.
async function startVietQRPayOSFlow(amount) {
    const modal = document.getElementById('qrModal');
    modal.style.display = 'flex';
    document.getElementById('qrTitle').textContent = "Đang tạo mã VietQR...";
    setText("qrSubtitle", "Đang kết nối PayOS, vui lòng đợi...");
    setText("qrStatusText", "Đang tạo mã thanh toán...");

    try {
        const response = await fetch('/api/payment/payos/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amount })
        });
        const data = await response.json();

        if (data.code !== '00') {
            alert("Không tạo được thanh toán PayOS: " + (data.desc || "Lỗi không xác định"));
            closeQRModal();
            return;
        }

        const payload = data.data;
        staffPayOSOrderCode = String(payload.orderCode);
        showQRModal(amount, payload.qrCode);
        startVietQRPolling();
    } catch (error) {
        console.error("Lỗi tạo thanh toán PayOS:", error);
        alert("Lỗi kết nối đến PayOS!");
        closeQRModal();
    }
}

function startVietQRPolling() {
    stopVietQRPolling();
    staffQrPollErrorCount = 0;
    const statusEl = document.getElementById('qrStatusText');

    staffQrPollInterval = setInterval(async () => {
        if (!staffPayOSOrderCode) return;
        try {
            const response = await fetch(`/api/payment/qr/status/${encodeURIComponent(staffPayOSOrderCode)}`);
            const data = await response.json();

            if (data.paymentStatus === 'SUCCESS') {
                if (statusEl) { statusEl.textContent = "Thanh toán thành công!"; statusEl.className = "qr-status qr-status-success"; }
                stopVietQRPolling();
                closeQRModal();
                executeCheckoutAPI();
            } else if (data.paymentStatus === 'CANCELLED') {
                if (statusEl) { statusEl.textContent = "Giao dịch đã bị hủy."; statusEl.className = "qr-status"; }
                stopVietQRPolling();
            } else {
                if (statusEl) { statusEl.textContent = "Đang chờ thanh toán..."; statusEl.className = "qr-status qr-status-wait"; }
            }
        } catch (error) {
            staffQrPollErrorCount++;
            console.error("Lỗi kiểm tra trạng thái QR:", error);
        }
    }, 3000);
}

function stopVietQRPolling() {
    if (staffQrPollInterval) { clearInterval(staffQrPollInterval); staffQrPollInterval = null; }
}

function showQRModal(amount, payOSQrCode = null) {
    const modal = document.getElementById('qrModal');
    const qrImage = document.getElementById('qrImage');
    const qrCaption = document.getElementById('qrCaption');
    const bankBadges = document.getElementById('qrBankBadges');
    const banksLabel = document.getElementById('qrBanksLabel');
    const statusText = document.getElementById('qrStatusText');
    document.getElementById('qrAmountDisplay').textContent = formatMoney(amount);

    document.getElementById('qrTitle').textContent = "Chuyển khoản QR Quốc Gia";
    setText("qrSubtitle", "Thanh toán an toàn qua VietQR - Napas 247");
    if (qrCaption) qrCaption.textContent = "Mã QR VietQR — Napas 247";
    if (bankBadges) bankBadges.style.display = 'flex';
    if (banksLabel) banksLabel.style.display = 'block';
    if (statusText) { statusText.style.display = 'block'; statusText.textContent = "Đang chờ thanh toán..."; statusText.className = "qr-status qr-status-wait"; }
    setStepTexts(
        "Mở app ngân hàng", "Chọn quét mã QR",
        "Quét mã QR", "Kiểm tra số tiền",
        "Xác nhận", "Hoàn tất thanh toán"
    );
    if (payOSQrCode) {
        // QR thật từ PayOS (đúng số tiền, đúng nội dung, quét ra ngân hàng thật) —
        // y hệt cách booking.js render bank-qr-img cho khách hàng.
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payOSQrCode)}`;
    } else {
        // Fallback hiếm khi dùng tới (PayOS lỗi nhưng vẫn muốn hiển thị gì đó).
        const BANK_BIN = "970422"; const ACCOUNT_NO = "0123456789"; const ACCOUNT_NAME = "CINEMA LUMI AI";
        qrImage.src = `https://img.vietqr.io/image/${BANK_BIN}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=Thanh toan ve phim&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
    }
    startQrCountdown(15 * 60);
    modal.style.display = 'flex';
}

window.closeQRModal = function() {
    document.getElementById('qrModal').style.display = 'none';
    if (qrCountdownInterval) { clearInterval(qrCountdownInterval); qrCountdownInterval = null; }
    stopVietQRPolling();
    staffPayOSOrderCode = null;
}
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
// Tra cứu đơn hàng/vé thật trong DB qua /api/pos/orders/search — trước đây
// hàm này chỉ so khớp với đơn vừa bán gần nhất lưu trong localStorage của
// đúng trình duyệt đó (không tra được đơn cũ / đơn từ máy POS khác).
window.searchTicket = async function () {
    const keyword = document.getElementById("ticketSearch").value.trim();
    const ticketResult = document.getElementById("ticketResult");

    if (!keyword) {
        showToast("Vui lòng nhập mã đơn hàng.", false);
        return;
    }

    try {
        const response = await fetch(`/api/pos/orders/search?code=${encodeURIComponent(keyword)}`);
        if (!response.ok) {
            ticketResult.classList.remove("show");
            const errText = await response.text();
            showToast(errText || "Không tìm thấy vé/đơn hàng.", false);
            return;
        }

        const order = await response.json();
        setText("resultOrderCode", order.orderCode || "N/A");
        setText("resultTicketCode", order.ticketCode || "N/A");
        setText("resultMovie", order.movie || "N/A");
        setText("resultShowtime", `${order.showtime || ""} - ${order.date || ""}`);
        setText("resultSeats", Array.isArray(order.seats) && order.seats.length ? order.seats.join(", ") : "N/A");
        ticketResult.classList.add("show");
    } catch (error) {
        console.error("Lỗi tìm vé:", error);
        ticketResult.classList.remove("show");
        showToast("Lỗi kết nối đến máy chủ.", false);
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
    setText("pageTitle", "Xin chào, " + fullName );
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
    loadPublicFeedbacks();
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

// Icon outline trắng dùng chung cho khu vực feedback (đồng bộ với style icon
// của toàn bộ giao diện POS).
const FB_ICON_USER = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>';
const FB_ICON_SEND = '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>';

// Vẽ 5 ngôi sao đánh giá, tô màu cam theo số sao thực tế (ratingStars).
function renderFbStars(rating) {
    const filled = Math.max(0, Math.min(5, Math.round(rating || 0)));
    let html = "";
    for (let i = 1; i <= 5; i++) {
        const cls = i <= filled ? "filled" : "empty";
        html += `<svg class="${cls}" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
    return html;
}

// Escape text hiển thị để tránh vỡ layout khi nội dung khách chứa ký tự đặc biệt.
function escapeFbText(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

// Hàm load danh sách phản hồi từ DB
// staff.js - Dành cho nhân viên (có kiểm tra đăng nhập)
async function loadFeedbacks() {
    console.log("🚀 Đang bắt đầu load feedback...");
    try {
        const [fbResponse, movieResponse, orderResponse] = await Promise.all([
            fetch('/api/pos/feedbacks').then(res => res.json()),
            fetch('/api/movies').then(res => res.json()),
            fetch('/api/orders').then(res => res.json())
        ]);

        // Tạo Map để tra cứu tên phim qua Order hoặc Movie ID
        const movieMap = {};
        movieResponse.forEach(m => movieMap[m.movieId || m.id] = m.title);

        const fbList = document.getElementById("feedbackList");
        if (!fbList) return;
        fbList.innerHTML = "";

        const parents = fbResponse.filter(fb => !fb.title.includes("Phản hồi"));
        const replies = fbResponse.filter(fb => fb.title.includes("Phản hồi"));

        parents.forEach(p => {
            // Lấy tên phim từ Map dựa trên movieId 
            const movieName = movieMap[p.movieId] || "Không xác định"; 
            
            const myReplies = replies.filter(r => r.title.includes(`ID: ${p.feedbackId}`));
            const div = document.createElement("div");
            div.className = "fb-review-card";

            div.innerHTML = `
                <div class="fb-review-head">
                    <div style="display: inline-block; background: rgba(255, 107, 53, 0.12); border: 1px solid rgba(255, 107, 53, 0.4); color: #ff6b35; font-size: 11.5px; font-weight: bold; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(255, 107, 53, 0.15);">
     PHIM: ${escapeFbText(movieName)}
</div>
                    <div class="fb-review-avatar">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FB_ICON_USER}</svg>
                    </div>
                    <div class="fb-review-headtext">
                        <b class="fb-review-name">Khách: ${escapeFbText(p.title)}</b>
                        <span class="fb-review-meta">Phản hồi khách hàng</span>
                    </div>
                    <div class="fb-review-stars">${renderFbStars(p.ratingStars || 5)}</div>
                </div>
                <p class="fb-review-content">${escapeFbText(p.content)}</p>
                ${myReplies.length > 0 ? `
                <div class="fb-review-replies">
                    ${myReplies.map(r => `
                        <div class="fb-reply-bubble"><b>Nhân viên:</b> ${escapeFbText(r.content.replace('Phản hồi: ', ''))}</div>
                    `).join('')}
                </div>` : ''}
                <button class="fb-respond-btn" onclick="openReplyModal(${p.feedbackId}, '${escapeFbText(p.title).replace(/'/g, "\\'")}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FB_ICON_SEND}</svg>
                    Phản hồi
                </button>
            `;

            fbList.appendChild(div);
        });
    } catch (e) { console.error("Lỗi:", e); }
}

document.addEventListener("DOMContentLoaded", function () {
    // Logic kiểm tra đăng nhập giữ nguyên cho nhân viên [cite: 901]
    const loggedUser = getLoggedUser();
    if (!loggedUser) return;
    
    loadFeedbacks(); // Gọi load ngay khi trang khởi tạo
});
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

    if (!content) {
        showToast("Vui lòng nhập nội dung phản hồi!", false, "VUI LÒNG NHẬP PHẢN HỒI");
        return;
    }

    try {
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
            showToast("Đã gửi phản hồi thành công!", true);
            document.getElementById("modalReplyText").value = "";
            closeModal();
            loadFeedbacks(); // Load lại danh sách
        } else {
            alert("Có lỗi xảy ra khi gửi phản hồi.");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể kết nối đến máy chủ.");
    }
};

// Popup thông báo góc màn hình (thay cho alert() ở một số chỗ) — theo bản
// chỉnh sửa của bạn cùng nhóm.
// Icon outline trắng đổi theo trạng thái: dấu tick tròn khi thành công,
// dấu chấm than tròn khi cảnh báo/lỗi.
const TOAST_ICON_CHECK = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
const TOAST_ICON_WARNING = '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>';

let toastHideTimer = null;
window.showToast = function(message, isSuccess = false, title = null) {
    const toast = document.getElementById("toastNotification");
    const titleElement = document.getElementById("toastTitle");
    const messageElement = document.getElementById("toastMessage");
    const iconSvg = document.getElementById("toastIconSvg");
    if (!toast || !titleElement || !messageElement) return;

    titleElement.textContent = title || (isSuccess ? "THÀNH CÔNG" : "CẢNH BÁO");
    messageElement.textContent = message;
    if (iconSvg) iconSvg.innerHTML = isSuccess ? TOAST_ICON_CHECK : TOAST_ICON_WARNING;

    if (isSuccess) {
        toast.classList.add("success");
    } else {
        toast.classList.remove("success");
    }

    toast.style.display = "flex";
    // Popup tự ẩn sau 3s; nếu gọi liên tiếp thì reset lại giờ đếm thay vì
    // để timer cũ tắt sớm popup mới.
    if (toastHideTimer) clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => { toast.style.display = "none"; }, 3000);
};
