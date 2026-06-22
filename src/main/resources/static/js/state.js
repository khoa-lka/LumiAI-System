// js/state.js
let serverData = { masterSeatStore: {}, movies: [], showtimes: [] };
let fnbMenu = [
  {
    id: "fnb1",
    name: "LAS Combo Thần Thánh",
    price: 85000,
    icon: "🍿",
    qty: 0,
  },
  {
    id: "fnb2",
    name: "My Combo (1 Bắp + 1 Nước)",
    price: 65000,
    icon: "🥤",
    qty: 0,
  },
  {
    id: "fnb3",
    name: "Snack Khoai Tây Phô Mai",
    price: 35000,
    icon: "🍟",
    qty: 0,
  },
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
let cgvNavigationHistory = ["panel-movies"];
let activeSearchKeyword = "";
let selectedDateStr = "";
let currentBannerIndex = 0;
let totalBanners = 0;
let temporaryRegisterEmail = "";
