window.addEventListener('DOMContentLoaded', () => {
    // Xử lý logic Đánh giá Sao (Stars)
    const stars = document.querySelectorAll('#star-rating-container .star');
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            let val = this.getAttribute('data-value');
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= val) s.classList.add('hovered');
                else s.classList.remove('hovered');
            });
        });
        star.addEventListener('mouseout', function() {
            stars.forEach(s => s.classList.remove('hovered'));
        });
        star.addEventListener('click', function() {
            currentRatingValue = this.getAttribute('data-value');
            stars.forEach(s => {
                if (s.getAttribute('data-value') <= currentRatingValue) s.classList.add('selected');
                else s.classList.remove('selected');
            });
        });
    });

    // Tạo form ngày sinh
    const daySelect = document.getElementById('reg-birth-day');
    const monthSelect = document.getElementById('reg-birth-month');
    const yearSelect = document.getElementById('reg-birth-year');
    if (daySelect && monthSelect && yearSelect) {
        for (let i = 1; i <= 31; i++) { daySelect.innerHTML += `<option value="${i}">${i}</option>`; }
        for (let i = 1; i <= 12; i++) { monthSelect.innerHTML += `<option value="${i}">Tháng ${i}</option>`; }
        for (let i = 2026; i >= 1950; i--) { yearSelect.innerHTML += `<option value="${i}">${i}</option>`; }
    }

    generateCgvDateSlider();
    renderFnbMenu();

    // Kích hoạt render dữ liệu Admin ngay khi load trang
    
});

// --- CHUYỂN TAB CÁC TRANG ---
function switchCgvTab(panelId, filterType = 'now_showing') {
    if (cgvNavigationHistory[cgvNavigationHistory.length - 1] !== panelId) { cgvNavigationHistory.push(panelId); }
    document.getElementById('bc-back-btn').style.display = (cgvNavigationHistory.length > 1) ? 'inline-block' : 'none';

    document.querySelectorAll('.cgv-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');

    const parentBc = document.getElementById('bc-parent-text');
    const currentBc = document.getElementById('bc-current-text');

    if(panelId === 'panel-movies') {
        document.getElementById('lnk-movies').classList.add('active');
        switchMovieFilterTab(filterType);
    }
    
    if(panelId === 'panel-booking') {
        if(parentBc) parentBc.innerText = "Đặt Vé Trực Tuyến";
        if(currentBc) currentBc.innerText = "Chọn Suất Chiếu & Ghế Ngồi";
        generateCgvDateSlider(); 
    }
    
    if(panelId === 'panel-profile') {
        if(parentBc) parentBc.innerText = "Thành Viên";
        if(currentBc) currentBc.innerText = "Tài Khoản LAS";
        switchProfileSubTab('chung');
    }
    if(panelId === 'panel-about') {
        if(parentBc) parentBc.innerText = "LumiAI System";
        if(currentBc) currentBc.innerText = "Về LAS Cinemas";
    }
    if(panelId === 'panel-terms') {
        if(parentBc) parentBc.innerText = "Chính Sách & Điều Khoản";
        if(currentBc) currentBc.innerText = "Điều Khoản Chung";
    }
    if(panelId === 'panel-transaction-terms') {
        if(parentBc) parentBc.innerText = "Chính Sách & Điều Khoản";
        if(currentBc) currentBc.innerText = "Điều Khoản Giao Dịch Trực Tuyến";
    }
    if(panelId === 'panel-privacy-policy') {
        if(parentBc) parentBc.innerText = "Chính Sách & Điều Khoản";
        if(currentBc) currentBc.innerText = "Chính Sách Bảo Mật Thông Tin";
    }
    if(panelId === 'panel-cinema-rules') {
        if(parentBc) parentBc.innerText = "Chính Sách & Điều Khoản";
        if(currentBc) currentBc.innerText = "Những Quy Định Tại Rạp Phim";
    }
    if(panelId === 'panel-faq') {
        if(parentBc) parentBc.innerText = "Hỗ Trợ Khách Hàng";
        if(currentBc) currentBc.innerText = "Câu Hỏi Thường Gặp (FAQ)";
    }
    if (typeof renderCgvInterface === 'function') renderCgvInterface();
}

function switchMovieFilterTab(filterType) {
    currentMovieFilter = filterType;
    document.getElementById('tab-title-now').classList.remove('active', 'tab-title-main');
    document.getElementById('tab-title-now').classList.add('tab-title-sub');
    document.getElementById('tab-title-coming').classList.remove('active', 'tab-title-main');
    document.getElementById('tab-title-coming').classList.add('tab-title-sub');
    
    if (filterType === 'now_showing') {
        document.getElementById('tab-title-now').classList.add('tab-title-main');
        document.getElementById('tab-title-now').classList.remove('tab-title-sub');
    } else {
        document.getElementById('tab-title-coming').classList.add('tab-title-main');
        document.getElementById('tab-title-coming').classList.remove('tab-title-sub');
    }
    if (typeof renderCgvInterface === 'function') renderCgvInterface();
}

function handleBreadcrumbBack() {
    if (cgvNavigationHistory.length <= 1) return;
    cgvNavigationHistory.pop(); 
    const prevPage = cgvNavigationHistory[cgvNavigationHistory.length - 1];
    switchCgvTab(prevPage);
    cgvNavigationHistory.pop(); 
}

function goHomeFromBc() { 
    cgvNavigationHistory = ['panel-movies']; 
    switchCgvTab('panel-movies', 'now_showing'); 
    if (typeof goToBookingStep === 'function') goToBookingStep(1);
}

function executeMovieRealTimeSearch() {
    const inputField = document.getElementById('movie-search-input');
    if (inputField) { activeSearchKeyword = inputField.value.trim().toLowerCase(); renderCgvInterface(); }
}

function handleTicketViewAccess() {
    if (!isUserLoggedInState) { alert("Vui lòng đăng nhập hệ thống!"); openAuthModal(); } 
    else { switchCgvTab('panel-profile'); switchProfileSubTab('lichsu'); }
}

function handleProfileTabAccess() {
    if (!isUserLoggedInState) { alert("Vui lòng đăng nhập hệ thống!"); openAuthModal(); } 
    else { switchCgvTab('panel-profile'); }
}

// --- CHI TIẾT PHIM ---
function switchMovieDetailTab(tabId) {
    document.getElementById('detail-tab-info').style.display = 'none';
    document.getElementById('detail-tab-review').style.display = 'none';
    document.getElementById('tab-btn-info').classList.remove('active');
    document.getElementById('tab-btn-review').classList.remove('active');

    if (tabId === 'info') {
        document.getElementById('detail-tab-info').style.display = 'flex';
        document.getElementById('tab-btn-info').classList.add('active');
    } else if (tabId === 'review') {
        document.getElementById('detail-tab-review').style.display = 'block';
        document.getElementById('tab-btn-review').classList.add('active');
    }
}

function viewMovieDetailText(title, genre) {
    document.getElementById('detail-movie-title').innerText = title;
    document.getElementById('detail-movie-genre').innerText = genre;
    switchMovieDetailTab('info');
    switchCgvTab('panel-movie-detail');
}

function submitReview() {
    const commentInput = document.getElementById('review-comment-text');
    const comment = commentInput.value.trim();
    if (currentRatingValue === 0) return alert('Vui lòng chọn mức độ sao để đánh giá phim!');
    if (!comment) return alert('Vui lòng nhập nội dung bình luận của bạn!');

    let userName = "Khách vãng lai";
    if (isUserLoggedInState) {
        const profileName = document.getElementById('profile-field-name').value;
        userName = profileName ? profileName : "Thành viên LAS";
    }

    const starsHtml = '★'.repeat(currentRatingValue) + '☆'.repeat(5 - currentRatingValue);
    const newReviewHtml = `
        <div style="padding: 15px; border-bottom: 1px solid #eee; background: #fff; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <strong style="color: #e71a0f;">${userName}</strong>
                <span style="color: #e5a93b; font-size: 16px;">${starsHtml}</span>
            </div>
            <p style="margin: 0; font-size: 14px; color: #444; line-height: 1.5;">${comment}</p>
            <div style="font-size: 11px; color: #888; margin-top: 8px;">Vừa xong</div>
        </div>
    `;
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.insertAdjacentHTML('afterbegin', newReviewHtml);

    commentInput.value = ''; currentRatingValue = 0;
    document.querySelectorAll('#star-rating-container .star').forEach(s => s.classList.remove('selected'));
    alert('Cảm ơn bạn đã gửi đánh giá!');
}

// --- QUẢN LÝ F&B ---
function renderFnbMenu() {
    const container = document.getElementById('cgv-fnb-menu');
    if (!container) return;
    container.innerHTML = '';
    fnbMenu.forEach((item, index) => {
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:1px solid #ddd; padding:15px; border-radius:8px; margin-bottom:12px; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div style="font-size:30px; background:#f4f2ec; width:60px; height:60px; display:flex; justify-content:center; align-items:center; border-radius:8px;">${item.icon}</div>
                    <div style="text-align:left;">
                        <div style="font-weight:bold; font-size:14px; color:#333;">${item.name}</div>
                        <div style="color:#e71a0f; font-weight:bold; font-size:14px; margin-top:5px;">${item.price.toLocaleString('vi-VN')} đ</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <button style="width:30px; height:30px; border:1px solid #ccc; background:#fff; font-weight:bold; cursor:pointer; border-radius:4px; font-size: 16px;" onclick="updateComboQty(${index}, -1)">-</button>
                    <span style="font-weight:bold; width: 20px; text-align: center; font-size: 16px;">${item.qty}</span>
                    <button style="width:30px; height:30px; border:1px solid #ccc; background:#fff; font-weight:bold; cursor:pointer; border-radius:4px; font-size: 16px;" onclick="updateComboQty(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });
}

function updateComboQty(index, change) {
    fnbMenu[index].qty += change;
    if (fnbMenu[index].qty < 0) fnbMenu[index].qty = 0;
    let totalFnbItems = fnbMenu.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('sum-fnb').innerText = totalFnbItems + " Combo";
    renderFnbMenu(); if (typeof calculateCgvCart === 'function') calculateCgvCart();
}

// --- TIỆN ÍCH NGÀY THÁNG LỊCH CHIẾU ---
function generateCgvDateSlider() {
    const container = document.getElementById('cgv-dynamic-date-slider');
    if (!container) return;
    container.innerHTML = '';
    container.style.display = "flex"; container.style.gap = "10px"; container.style.overflowX = "auto"; container.style.paddingBottom = "10px";

    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date(2026, 5, 8); 

    for (let i = 0; i < 30; i++) {
        const targetDate = new Date(2026, 5, 8);
        targetDate.setDate(now.getDate() + i);

        const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
        const dateNum = targetDate.getDate().toString().padStart(2, '0');
        const dayName = daysOfWeek[targetDate.getDay()];
        const fullDateId = `2026-${month}-${dateNum}`;

        if (i === 0 && !selectedDateStr) { selectedDateStr = fullDateId; }
        const bg = (selectedDateStr === fullDateId) ? '#111' : '#fff'; 
        const color = (selectedDateStr === fullDateId) ? '#fff' : '#555';
        const border = (selectedDateStr === fullDateId) ? '#111' : '#ccc';

        container.innerHTML += `
            <div style="flex: 0 0 auto; min-width: 60px; background:${bg}; color:${color}; border:2px solid ${border}; border-radius:6px; cursor:pointer; text-align:center; padding: 10px 5px; box-sizing: border-box; transition: all 0.2s;" onclick="selectCgvBookingDate('${fullDateId}')">
                <div style="font-size:11px; margin-bottom: 2px;">${dayName}</div>
                <div style="font-size:22px; font-weight:bold; line-height: 1;">${dateNum}</div>
                <div style="font-size:11px; margin-top: 3px;">Th ${month}</div>
            </div>
        `;
    }
}
function selectCgvBookingDate(dateStr) { selectedDateStr = dateStr; generateCgvDateSlider(); selectedSeats = []; if (typeof renderCgvInterface === 'function') renderCgvInterface(); }

// --- HỒ SƠ CÁ NHÂN & LỊCH SỬ GIAO DỊCH ---
function switchProfileSubTab(sub) {
    document.querySelectorAll('.arrow-btn').forEach(b => b.classList.remove('active'));
    ['chung', 'chitiet', 'matma', 'the', 'diem', 'lichsu'].forEach(p => { 
        const panel = document.getElementById('pro-panel-' + p);
        if(panel) panel.classList.remove('active'); 
    });
    const currentBtn = document.getElementById('pro-subtab-btn-' + sub);
    const currentPanel = document.getElementById('pro-panel-' + sub);
    if(currentBtn) currentBtn.classList.add('active');
    if(currentPanel) currentPanel.classList.add('active');
}

function activateEditableFormFields() {
    document.querySelectorAll('.profile-readonly-input').forEach(input => {
        input.removeAttribute('readonly'); input.style.border = '1px solid var(--cgv-red)'; input.style.background = '#fff';
    });
    document.getElementById('btn-save-profile').style.display = 'block';
}

function saveUpdatedProfileInformationData() {
    document.querySelectorAll('.profile-readonly-input').forEach(input => {
        input.setAttribute('readonly', true); input.style.border = '1px solid #ccc'; input.style.background = '#f9f9f9';
    });
    document.getElementById('btn-save-profile').style.display = 'none';
    alert("Cập nhật thông tin tài khoản mới thành công!");
}

function renderTransactionHistory() {
    const historyZone = document.getElementById('cgv-invoice-zone');
    if (userPastInvoices.length === 0) {
        historyZone.innerHTML = '<p style="color:#777; font-size: 13px;">Bạn chưa thực hiện giao dịch mua vé trực tuyến nào gần đây.</p>';
        return;
    }
    historyZone.innerHTML = '';
    userPastInvoices.forEach(inv => {
        historyZone.innerHTML += `
            <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; background: white; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: var(--cgv-red);">${inv.movie}</h4>
                    <p style="margin: 0; font-size: 13px; color: #555;">Mã ĐH: <b>${inv.id}</b> | Ngày: ${inv.date} | Trạng thái: <span style="color: green;">${inv.status}</span></p>
                </div>
                <button onclick="viewHistoryDetail('${inv.id}')" style="background: var(--cgv-gold); border: none; padding: 8px 15px; cursor: pointer; font-weight: bold; border-radius: 4px;">Xem Chi Tiết</button>
            </div>
        `;
    });
}

function viewHistoryDetail(invoiceId) {
    const inv = userPastInvoices.find(i => i.id === invoiceId);
    if(!inv) return;
    let fnbHtml = inv.fnb.map(i => `<li>${i.name} x${i.qty}</li>`).join('');
    document.getElementById('history-detail-content').innerHTML = `
        <p><strong>Mã vé:</strong> <span style="color:red;">${inv.id}</span></p>
        <p><strong>Phim:</strong> ${inv.movie}</p>
        <p><strong>Suất:</strong> ${inv.time} ngày ${inv.date}</p>
        <hr style="margin: 10px 0;">
        <p><strong>🎟️ Vé ghế ngồi:</strong> ${inv.seats.join(', ')}</p>
        <p><strong>🍿 Bắp nước:</strong></p>
        <ul>${fnbHtml || '<li>Không có</li>'}</ul>
        <hr style="margin: 10px 0;">
        <p style="font-size: 16px; text-align: right;"><strong>Thành tiền: <span style="color:red;">${inv.total.toLocaleString('vi-VN')} đ</span></strong></p>
    `;
    document.getElementById('history-detail-modal').classList.add('open');
}

function closeHistoryDetailModal() { document.getElementById('history-detail-modal').classList.remove('open'); }