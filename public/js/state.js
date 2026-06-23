// Khởi tạo các biến trạng thái toàn cục
let currentRatingValue = 0;
let ws = new WebSocket('ws://127.0.0.1:3000');
let serverData = { masterSeatStore: {}, movies: [], showtimes: [] };
let fnbMenu = [
    { id: 'fnb1', name: 'LAS Combo Thần Thánh', price: 85000, icon: '🍿', qty: 0 },
    { id: 'fnb2', name: 'My Combo (1 Bắp + 1 Nước)', price: 65000, icon: '🥤', qty: 0 },
    { id: 'fnb3', name: 'Snack Khoai Tây Phô Mai', price: 35000, icon: '🍟', qty: 0 }
];
let appliedVoucherDiscount = 0; 
let userPastInvoices = []; 
let selectedSeats = [];
let selectedShowtime = "";
let currentMovieFilter = "now_showing";
let currentPriceTotal = 0;
let isHoldingState = false;
let timerInterval = null;
let isUserLoggedInState = false;
let currentBookingStep = 1;
let cgvNavigationHistory = ['panel-movies']; 
let activeSearchKeyword = ""; 
let selectedDateStr = "";
let selectedPaymentGateway = 'qr';
let registeredEmailCache = "";

// Lắng nghe dữ liệu từ Server (WebSocket)
ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'SYNC_DATA') {
        serverData = msg.data;
        const selectCombo = document.getElementById('cgv-combo-movie');
        if(selectCombo && serverData.movies.length > 0) {
            const currentVal = selectCombo.value;
            selectCombo.innerHTML = '';
            serverData.movies.forEach(m => {
                if(m.status === 'now_showing') selectCombo.innerHTML += `<option value="${m.title}">${m.title}</option>`;
            });
            if(currentVal && [...selectCombo.options].some(o => o.value === currentVal)) selectCombo.value = currentVal;
        }
        if(!selectedShowtime && serverData.showtimes.length > 0) selectedShowtime = serverData.showtimes[0];
        if (typeof renderCgvInterface === 'function') renderCgvInterface();
    }
};