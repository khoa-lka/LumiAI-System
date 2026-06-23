function renderCgvInterface() {
    const movieZone = document.getElementById('cgv-movie-list');
    const selectCombo = document.getElementById('cgv-combo-movie');
    if (!movieZone || !selectCombo) return;

    movieZone.innerHTML = '';
    let rankCounter = 1;

    serverData.movies.forEach((m) => {
        if (m.status === currentMovieFilter) {
            const matchesKeyword = m.title.toLowerCase().includes(activeSearchKeyword) || m.genre.toLowerCase().includes(activeSearchKeyword);
            
            if (activeSearchKeyword === "" || matchesKeyword) {
                let ribbonColor = "ribbon-blue";
                if(rankCounter === 1) ribbonColor = "ribbon-red";
                if(rankCounter === 2) ribbonColor = "ribbon-orange";

                let actionBtnHTML = m.status === 'now_showing'
                    ? `<button class="btn-cgv-buy-ticket-spec" onclick="quickBookMovie('${m.title}')">🎟️ MUA VÉ</button>`
                    : `<button class="btn-cgv-buy-ticket-spec" style="background-color:#555; cursor:not-allowed;" disabled>📋 SẮP CHIẾU</button>`;

                let cleanImgUrl = m.img || 'https://www.cgv.vn/media/catalog/product/placeholder/default/cgv_title.png';

                movieZone.innerHTML += `
                    <div class="movie-spec-card">
                        <div class="poster-wrapper-box">
                            <span class="age-label-badge">${m.status === 'now_showing' ? 'T16' : 'P'}</span>
                            <div class="rank-ribbon ${ribbonColor}">${rankCounter}</div>
                            <div class="poster-main-body-img" onclick="viewMovieDetailText('${m.title}', '${m.genre}')" style="background: #111; width: 100%; height: 100%;">
                                <img src="${cleanImgUrl}" alt="${m.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            </div>
                        </div>
                        <div class="movie-spec-info-text">
                            <h3 class="movie-spec-title" onclick="viewMovieDetailText('${m.title}', '${m.genre}')">${m.title}</h3>
                            <p>Thể loại: <b>${m.genre}</b></p>
                        </div>
                        <div class="movie-spec-action-zone">${actionBtnHTML}</div>
                    </div>
                `;
                rankCounter++;
            }
        }
    });

    const currentMovie = selectCombo.value || (selectCombo.options[0] ? selectCombo.options[0].value : "");
    document.getElementById('sum-movie-title').innerText = currentMovie || '-';

    const timeGrid = document.getElementById('cgv-showtime-grid');
    if (timeGrid) {
        timeGrid.innerHTML = '';
        serverData.showtimes.forEach(t => {
            const activeClass = (t === selectedShowtime) ? 'active' : '';
            timeGrid.innerHTML += `<div class="showtime-btn ${activeClass}" onclick="selectTime('${t}')">${t}</div>`;
        });
    }
    document.getElementById('sum-showtime').innerText = selectedShowtime || '-';

    const seatGrid = document.getElementById('cgv-seat-grid');
    if (seatGrid) {
        seatGrid.innerHTML = '';
        const activeSeatMap = serverData.masterSeatStore[currentMovie]?.[selectedShowtime] || {};

        Object.keys(activeSeatMap).forEach(id => {
            const s = activeSeatMap[id];
            let seatType = "Standard";
            if(id.startsWith('C')) seatType = "VIP";
            if(id.startsWith('D')) seatType = "Sweetbox";

            const div = document.createElement('div');
            div.className = `cgv-seat ${seatType} ${s.status}`;
            div.innerText = id;

            if (selectedSeats.includes(id)) div.classList.add('selected');

            if (!isHoldingState && s.status === 'available') {
                div.onclick = () => {
                    if (selectedSeats.includes(id)) selectedSeats = selectedSeats.filter(x => x !== id);
                    else selectedSeats.push(id);
                    calculateCgvCart(); renderCgvInterface();
                };
            }
            seatGrid.appendChild(div);
        });
    }
}

function handleBookNowClick() {
    if (!isUserLoggedInState) {
        alert("Vui lòng đăng nhập hệ thống để tiếp tục đặt vé!");
        openAuthModal(); 
    } else {
        const currentMovieTitle = document.getElementById('detail-movie-title').innerText;
        switchCgvTab('panel-booking');
        const selectCombo = document.getElementById('cgv-combo-movie');
        if (selectCombo && currentMovieTitle !== '-') {
            if([...selectCombo.options].some(o => o.value === currentMovieTitle)) {
                selectCombo.value = currentMovieTitle;
            }
            onMovieOrTimeChange(); 
        }
        if (typeof goToBookingStep === 'function') goToBookingStep(1);
    }
}

function quickBookMovie(movieTitle) {
    switchCgvTab('panel-booking');
    const selectCombo = document.getElementById('cgv-combo-movie');
    if(selectCombo) { selectCombo.value = movieTitle; onMovieOrTimeChange(); }
}

function selectTime(t) {
    if(isHoldingState) return alert("Hóa đơn đã khóa thanh toán!");
    selectedShowtime = t; selectedSeats = []; calculateCgvCart(); renderCgvInterface();
}

function onMovieOrTimeChange() { resetHoldState(); selectedSeats = []; calculateCgvCart(); renderCgvInterface(); }

function calculateCgvCart() {
    document.getElementById('sum-seats').innerText = selectedSeats.join(', ') || 'Chưa chọn';
    let total = 0; let totalFnbItems = 0; 

    selectedSeats.forEach(id => {
        if(id.startsWith('C')) total += 110000;
        else if(id.startsWith('D')) total += 250000;
        else total += 90000;
    });
    
    fnbMenu.forEach(item => {
        total += (item.qty * item.price); totalFnbItems += item.qty; 
    });
    
    document.getElementById('sum-fnb').innerText = totalFnbItems + " Combo";
    currentPriceTotal = total;
    let finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
    document.getElementById('sum-total').innerText = finalTotal.toLocaleString('vi-VN') + " đ";
}

function goToBookingStep(step) {
    document.querySelectorAll('.las-step-bar-container .step-item').forEach((el, idx) => {
        if(idx + 1 === step) el.classList.add('active'); else el.classList.remove('active');
    });

    document.querySelectorAll('.booking-step').forEach(el => el.classList.remove('active'));
    const currentStepEl = document.getElementById('booking-step-' + step);
    if (currentStepEl) currentStepEl.classList.add('active');

    const mainBtn = document.getElementById('btn-main-action');
    const backBtn = document.querySelector('.btn-flow-back');
    const layoutGrid = document.querySelector('.booking-two-columns-layout');
    const rightColumn = document.querySelector('.right-invoice-sticky-column');
    
    if (step === 1) {
        if(layoutGrid) layoutGrid.style.gridTemplateColumns = "1fr 380px"; 
        if(rightColumn) rightColumn.style.display = "flex";
        if(mainBtn) { mainBtn.innerText = "Tiếp Tục"; mainBtn.style.background = "#e71a0f"; }
        if(backBtn) { backBtn.innerText = "←"; backBtn.setAttribute('onclick', 'goHomeFromBc()'); }
    } else if (step === 2) {
        if(mainBtn) { mainBtn.innerText = "Đến Thanh Toán"; mainBtn.style.background = "#e71a0f"; }
        if(backBtn) { backBtn.innerText = "← Quay Lại"; backBtn.setAttribute('onclick', 'goToBookingStep(1)'); }
    } else if (step === 3) {
        if(mainBtn) { mainBtn.innerText = "Thanh Toán Ngay"; mainBtn.style.background = "#10B981"; }
        if(backBtn) { backBtn.innerText = "← Chọn F&B"; backBtn.setAttribute('onclick', 'goToBookingStep(2)'); }
        
        const currentMovie = document.getElementById('cgv-combo-movie').value;
        let fnbHtml = fnbMenu.filter(i => i.qty > 0).map(i => `<p>+ ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString('vi-VN')} đ</p>`).join('');
        document.getElementById('review-invoice-content').innerHTML = `
            <p><strong>Phim:</strong> ${currentMovie}</p>
            <p><strong>Suất chiếu:</strong> ${selectedDateStr} | ${selectedShowtime}</p>
            <p><strong>Ghế:</strong> ${selectedSeats.join(', ')}</p>
            <p><strong>Bắp nước:</strong></p>${fnbHtml || '<p>Không có</p>'}
            <hr style="margin: 10px 0;">
            <p style="font-size: 16px;"><strong>Tổng cộng (Chưa giảm): <span style="color:#e71a0f;">${currentPriceTotal.toLocaleString('vi-VN')} đ</span></strong></p>
        `;
        document.getElementById('review-final-total').innerText = currentPriceTotal.toLocaleString('vi-VN') + " đ";
    } else if (step === 4) {
        if(rightColumn) rightColumn.style.display = "none"; 
        if(layoutGrid) layoutGrid.style.gridTemplateColumns = "1fr";
    }
    currentBookingStep = step;
    const bookingPanel = document.getElementById('panel-booking');
    if (bookingPanel) bookingPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleMainAction() {
    if (!isUserLoggedInState) {
        alert("Bạn phải đăng nhập tài khoản thành viên mới có thể tiến hành đặt vé!");
        openAuthModal(); return;          
    }

    if (currentBookingStep === 1) {
        if (selectedSeats.length === 0) { alert('Vui lòng chọn ghế trước!'); return; }
        if (!isHoldingState) {
            isHoldingState = true;
            document.getElementById('hold-timer').style.display = "flex";
            startCountdown(Date.now() + 5 * 60 * 1000); 
        }
        goToBookingStep(2); 
    } else if (currentBookingStep === 2) {
        goToBookingStep(3); 
    } else if (currentBookingStep === 3) {
        processToPaymentGateway(); 
    }
}

function selectPaymentGatewayType(type, element) {
    selectedPaymentGateway = type;
    document.querySelectorAll('.payment-option-row').forEach(row => row.classList.remove('active'));
    element.classList.add('active');
}

function applyVoucher() {
    const code = document.getElementById('voucher-input').value.trim().toUpperCase();
    if (code === 'LAS20') {
        appliedVoucherDiscount = 0.2; alert("Áp dụng thành công Voucher giảm 20%!");
    } else {
        appliedVoucherDiscount = 0; alert("Mã Voucher không hợp lệ hoặc đã hết hạn!");
    }
    const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
    document.getElementById('review-final-total').innerText = finalTotal.toLocaleString('vi-VN') + " đ";
    calculateCgvCart();
}

function openCheckoutReview() {
    const currentMovie = document.getElementById('cgv-combo-movie').value;
    let fnbHtml = fnbMenu.filter(i => i.qty > 0).map(i => `<p>+ ${i.name} (x${i.qty}): ${(i.price * i.qty).toLocaleString('vi-VN')} đ</p>`).join('');
    
    document.getElementById('review-invoice-content').innerHTML = `
        <p><strong>Phim:</strong> ${currentMovie}</p>
        <p><strong>Suất chiếu:</strong> ${selectedDateStr} | ${selectedShowtime}</p>
        <p><strong>Ghế:</strong> ${selectedSeats.join(', ')}</p>
        <p><strong>Bắp nước:</strong></p>
        ${fnbHtml || '<p>Không có</p>'}
        <hr style="margin: 10px 0;">
        <p><strong>Tổng cộng (Chưa giảm):</strong> ${currentPriceTotal.toLocaleString('vi-VN')} đ</p>
    `;
    
    appliedVoucherDiscount = 0; 
    document.getElementById('voucher-input').value = '';
    document.getElementById('review-final-total').innerText = currentPriceTotal.toLocaleString('vi-VN') + " đ";
    document.getElementById('checkout-review-modal').classList.add('open');
}

function closeCheckoutReview() {
    document.getElementById('checkout-review-modal').classList.remove('open');
    appliedVoucherDiscount = 0; calculateCgvCart();
}

function processToPaymentGateway() {
    closeCheckoutReview(); 
    const finalTotal = currentPriceTotal * (1 - appliedVoucherDiscount);
    
    if (selectedPaymentGateway === 'qr') {
        document.getElementById('qr-total-price').innerText = finalTotal.toLocaleString('vi-VN') + " đ";
        const bankId = "ICB"; 
        const accountNo = "101879388698"; 
        const accountName = "NGUYEN BAO HOANG"; 
        const qrData = `LAS CINEMAS THANH TOAN`;
        document.getElementById('bank-qr-img').src = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${finalTotal}&addInfo=${encodeURIComponent(qrData)}&accountName=${encodeURIComponent(accountName)}`;
        document.getElementById('payment-redirect-modal').classList.add('open');
    } else {
        alert(`Đang kết nối đến cổng giao dịch an toàn của ${selectedPaymentGateway.toUpperCase()}... Vui lòng không đóng trình duyệt.`);
        executeFinalCheckout(); 
    }
}

function backToPaymentSelection() {
    document.getElementById('payment-redirect-modal').classList.remove('open');
    document.getElementById('checkout-review-modal').classList.add('open');    
}

function closePaymentModal() { document.getElementById('payment-redirect-modal').classList.remove('open'); }

function executeFinalCheckout() {
    const currentMovie = document.getElementById('cgv-combo-movie').value;
    let currentEmail = "";

    if (isUserLoggedInState) {
        currentEmail = document.getElementById('profile-field-email').value;
    } else {
        currentEmail = prompt("Vui lòng nhập địa chỉ Email để nhận mã vé điện tử:", "");
        if (!currentEmail) {
            alert("Bạn cần nhập Email để hoàn tất giao dịch!");
            return;
        }
    }
    
    fetch('/api/seats/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie: currentMovie, showtime: selectedShowtime, seats: selectedSeats, email: currentEmail })
    }).then(res => res.json()).then(data => {
        document.getElementById('payment-redirect-modal').classList.remove('open');
        
        if(data.success) {
            selectedSeats.forEach(seatId => {
                if (serverData.masterSeatStore[currentMovie] && serverData.masterSeatStore[currentMovie][selectedShowtime]) {
                    serverData.masterSeatStore[currentMovie][selectedShowtime][seatId].status = 'sold';
                }
            });

            const lasTicketId = data.ticketId ? data.ticketId.replace('CGV-', 'LAS-') : "LAS-" + Math.floor(Math.random() * 1000000);
            const invoiceObj = {
                id: lasTicketId, movie: currentMovie, date: selectedDateStr, time: selectedShowtime,
                seats: [...selectedSeats], fnb: fnbMenu.filter(i => i.qty > 0).map(i => ({...i})),
                total: currentPriceTotal * (1 - appliedVoucherDiscount), status: 'Đã thanh toán'
            };
            userPastInvoices.unshift(invoiceObj); 
            
            resetHoldState(); selectedSeats = []; fnbMenu.forEach(i => i.qty = 0); 
            renderFnbMenu(); calculateCgvCart(); renderCgvInterface(); 
            
            let fnbHtml = invoiceObj.fnb.map(i => `<li>${i.name} x${i.qty}</li>`).join('');
            const beautifulTicketHTML = `
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="color: #10B981; margin-bottom: 10px; font-size: 28px;">ĐẶT VÉ THÀNH CÔNG!</h2>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${invoiceObj.id}" style="border: 1px solid #ccc; padding: 5px;">
                    <p style="color: #222; font-weight: bold; font-size: 13px; margin-top: 10px;">Hệ thống cũng đã gửi 1 bản sao vào Email của bạn.</p>
                </div>
                <div style="background: #fdfcf7; padding: 25px 40px; border: 2px dashed #ccc; border-radius: 8px; text-align: left; display: inline-block; min-width: 90%; margin: 0 auto; box-sizing: border-box;">
                    <p><strong>Mã vé:</strong> <span style="color:red; font-size: 22px;">${invoiceObj.id}</span></p>
                    <p><strong>Phim:</strong> ${invoiceObj.movie}</p>
                    <p><strong>Suất chiếu:</strong> ${invoiceObj.time} ngày ${invoiceObj.date}</p>
                    <hr style="margin: 15px 0;"><p><strong>🎟️ Ghế:</strong> ${invoiceObj.seats.join(', ')}</p>
                    <p><strong>🍿 F&B:</strong></p><ul>${fnbHtml || '<li>Không có</li>'}</ul>
                    <hr style="margin: 15px 0;">
                    <p style="font-size: 20px; text-align: right; margin: 0;"><strong>Đã thanh toán: <span style="color:red;">${invoiceObj.total.toLocaleString('vi-VN')} đ</span></strong></p>
                </div>
                <div style="margin-top: 30px; text-align: center;">
                    <button class="btn-cgv-submit" style="width: auto; padding: 12px 30px; background: #555;" onclick="document.getElementById('history-detail-modal').classList.remove('open'); goHomeFromBc()">VỀ TRANG CHỦ</button>
                </div>
            `;

            const finalResultDiv = document.getElementById('final-ticket-result');
            if (finalResultDiv) {
                finalResultDiv.innerHTML = beautifulTicketHTML;
                goToBookingStep(4);
            }
            if (isUserLoggedInState) renderTransactionHistory();
        } else {
            alert("Rất tiếc, giao dịch không thành công hoặc ghế đã bị đặt. Vui lòng thử lại!");
        }
    }).catch(error => { console.error("Lỗi đặt vé:", error); alert("Đã xảy ra lỗi kết nối với máy chủ!"); });
}

function cancelCurrentTransaction() {
    if(confirm("Bạn có chắc chắn muốn hủy giao dịch và bỏ giữ các ghế này không?")) {
        const currentMovie = document.getElementById('cgv-combo-movie').value;
        fetch('/api/seats/cancel', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie: currentMovie, showtime: selectedShowtime, seats: selectedSeats })
        }).then(() => {
            resetHoldState(); selectedSeats = []; fnbMenu.forEach(i => i.qty = 0); 
            renderFnbMenu(); calculateCgvCart(); renderCgvInterface();
            alert("Đã hủy giao dịch và giải phóng ghế!");
        });
    }
}

function startCountdown(expiresAt) {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const remain = expiresAt - Date.now();
        if (remain <= 0) {
            clearInterval(timerInterval); alert("Hết thời gian giữ ghế 5 phút!");
            resetHoldState(); selectedSeats = []; calculateCgvCart();
        } else {
            const minutes = Math.floor(remain / 60000); const seconds = Math.floor((remain % 60000) / 1000);
            document.getElementById('timer-string').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function resetHoldState() {
    clearInterval(timerInterval); isHoldingState = false;
    document.getElementById('hold-timer').style.display = "none";
    document.getElementById('btn-main-action').innerText = "Tiếp tục";
    document.getElementById('btn-main-action').style.background = "#e71a0f";
    currentBookingStep = 1; 
}