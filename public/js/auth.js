// --- QUẢN LÝ MODAL AUTH ---
function openAuthModal() { document.getElementById('auth-modal').classList.add('open'); generateNewLoginCaptcha(); generateNewRegisterCaptcha(); }
function closeAuthModal() { document.getElementById('auth-modal').classList.remove('open'); }

function toggleAuthTab(type) {
    document.getElementById('tab-login-btn').classList.remove('active');
    document.getElementById('tab-register-btn').classList.remove('active');
    document.getElementById('form-login-panel').classList.remove('active');
    document.getElementById('form-register-panel').classList.remove('active');
    
    if (type === 'login') {
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('form-login-panel').classList.add('active');
    } else if (type === 'register') {
        document.getElementById('tab-register-btn').classList.add('active');
        document.getElementById('form-register-panel').classList.add('active');
    }
}

function toggleRegPasswordState() {
    const passInput = document.getElementById('reg-password');
    if(passInput) passInput.type = (passInput.type === 'password') ? 'text' : 'password';
}

// --- CAPTCHA ---
function generateRandomCaptcha(length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}
function generateNewLoginCaptcha() { document.getElementById('login-captcha-text').innerText = generateRandomCaptcha(); }
function generateNewRegisterCaptcha() { document.getElementById('reg-captcha-text').innerText = generateRandomCaptcha(); }
function generateForgotCaptcha() { document.getElementById('forgot-captcha-text').innerText = generateRandomCaptcha(); }

// --- QUÊN MẬT KHẨU ---
function openForgotModal() { document.getElementById('forgot-modal').classList.add('open'); generateForgotCaptcha(); }
function closeForgotModal() { document.getElementById('forgot-modal').classList.remove('open'); }

function executeForgotRequestSubmit() {
    const emailInput = document.getElementById('forgot-email-input').value.trim();
    const captchaInput = document.getElementById('forgot-captcha-input').value.trim();
    const currentCaptchaText = document.getElementById('forgot-captcha-text').innerText;

    if (!emailInput) return alert("Vui lòng nhập địa chỉ email hoặc số điện thoại!");
    if (captchaInput.toUpperCase() !== currentCaptchaText.toUpperCase()) return alert("Mã xác nhận bảo mật không chính xác!");

    alert("Yêu cầu khôi phục mật khẩu đã được gửi đến: " + emailInput + ". Vui lòng kiểm tra hộp thư!");
    document.getElementById('forgot-email-input').value = "";
    document.getElementById('forgot-captcha-input').value = "";
    closeForgotModal(); openAuthModal(); toggleAuthTab('login');
}

// --- ĐĂNG NHẬP ---
// --- ĐĂNG NHẬP ---
function submitCgvLogin(event) {
    if (event) event.preventDefault();
    const user = document.getElementById('auth-username').value.trim();
    const pass = document.getElementById('auth-password').value;
    const captchaInput = document.getElementById('login-captcha').value.trim();
    const currentLoginCaptcha = document.getElementById('login-captcha-text').innerText;

    if (!user || !pass) return alert('Vui lòng nhập đầy đủ tài khoản và mật khẩu đăng nhập!');
    if (!captchaInput) return alert('Vui lòng nhập mã bảo vệ Captcha!');
    if (captchaInput.toUpperCase() !== currentLoginCaptcha.toUpperCase()) {
        alert('Mã bảo vệ Captcha nhập vào không chính xác!');
        generateNewLoginCaptcha(); document.getElementById('login-captcha').value = ""; return;
    }

    // --- 1. TÀI KHOẢN TEST: ADMIN (QUẢN TRỊ HỆ THỐNG) ---
    if (user === 'admin' && pass === '123') {
        isUserLoggedInState = true;
        closeAuthModal();
        document.querySelectorAll('.cgv-panel').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
        
        const adminPanel = document.getElementById('panel-admin-dashboard');
        if (adminPanel) { adminPanel.classList.add('active'); adminPanel.style.display = 'block'; }
        
        updateTopBarMenu("Nguyễn Bảo Hoàng", "ADMIN");
        renderAdminBanList(); renderAdminSysLog(); renderAdminFaq(); renderAdminWebhook(); renderAdminDbBackups();
        alert("[QUẢN TRỊ HỆ THỐNG] Đăng nhập Test thành công!");
        return; 
    }

    // --- 2. TÀI KHOẢN TEST: MANAGER (QUẢN LÝ RẠP) ---
    if (user === 'manager' && pass === '123') {
        isUserLoggedInState = true;
        closeAuthModal();
        document.querySelectorAll('.cgv-panel').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });
        
        // Gọi ID của giao diện Manager bạn vừa dán trong HTML nè
        const managerPanel = document.getElementById('panel-manager-dashboard');
        if (managerPanel) { managerPanel.classList.add('active'); managerPanel.style.display = 'block'; }
        
        updateTopBarMenu("Trần Thị Quản Lý", "MANAGER");
        alert("[QUẢN LÝ RẠP] Đăng nhập Test thành công!");
        return; 
    }

    // --- 3. LUỒNG GỌI API BACKEND THỰC TẾ ---
    fetch('http://localhost:8080/api/login/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: user, password: pass })
    })
    .then(res => { if (!res.ok && res.status !== 401) throw new Error("Lỗi Server!"); return res.json(); })
    .then(response => {
        if (response.status === 'success') {
            isUserLoggedInState = true;
            const userData = response.data;
            sessionStorage.setItem('userRoleId', userData.roleId);
            sessionStorage.setItem('userFullName', userData.fullName);
            sessionStorage.setItem('userEmail', userData.email);
            closeAuthModal();

            const userRole = parseInt(userData.roleId);
            document.querySelectorAll('.cgv-panel').forEach(panel => { panel.classList.remove('active'); panel.style.display = 'none'; });

            if (userRole === 1) { // ROLE 1: ADMIN
                alert(`[QUẢN LÝ HỆ THỐNG] Xin chào Admin: ${userData.fullName}.`);
                const adminPanel = document.getElementById('panel-admin-dashboard');
                if (adminPanel) { adminPanel.classList.add('active'); adminPanel.style.display = 'block'; }
                updateTopBarMenu(userData.fullName, "ADMIN");
                renderAdminBanList(); renderAdminSysLog(); renderAdminFaq(); renderAdminWebhook(); renderAdminDbBackups();
            } else if (userRole === 4) { // ROLE 4: MANAGER
                alert(`[QUẢN LÝ RẠP] Xin chào Manager: ${userData.fullName}.`);
                const managerPanel = document.getElementById('panel-manager-dashboard');
                if (managerPanel) { managerPanel.classList.add('active'); managerPanel.style.display = 'block'; }
                updateTopBarMenu(userData.fullName, "MANAGER");
            } else if (userRole === 2) { // ROLE 2: NHÂN VIÊN
                alert(`[NHÂN VIÊN RẠP] Xin chào: ${userData.fullName}.`);
                const staffPanel = document.getElementById('panel-staff-dashboard');
                if (staffPanel) { staffPanel.classList.add('active'); staffPanel.style.display = 'block'; }
                updateTopBarMenu(userData.fullName, "NHÂN VIÊN");
            } else if (userRole === 3) { // ROLE 3: KHÁCH HÀNG
                alert(`Chào mừng Hội viên LAS Cinemas: ${userData.fullName} đã quay trở lại!`);
                if (document.getElementById('profile-field-name')) document.getElementById('profile-field-name').value = userData.fullName;
                if (document.getElementById('profile-field-phone')) document.getElementById('profile-field-phone').value = userData.phoneNumber || "";
                if (document.getElementById('profile-field-email')) document.getElementById('profile-field-email').value = userData.email;
                if (document.getElementById('profile-field-birth')) document.getElementById('profile-field-birth').value = userData.birthDate || "";
                
                const profilePanel = document.getElementById('panel-profile');
                if (profilePanel) { profilePanel.classList.add('active'); profilePanel.style.display = 'block'; }
                updateTopBarMenu(userData.fullName, "MEMBER");
                if (typeof switchCgvTab === "function") switchCgvTab('panel-profile');
            }
        } else {
            alert("ĐĂNG NHẬP THẤT BẠI: " + response.message);
            generateNewLoginCaptcha(); document.getElementById('login-captcha').value = "";
        }
    }).catch(err => { console.error(err); alert("Sự cố hệ thống!"); });
}
// --- ĐĂNG KÝ & OTP ---
function submitCgvRegister(event) {
    if (event) event.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const captchaInput = document.getElementById('reg-captcha').value.trim();
    const currentRegCaptcha = document.getElementById('reg-captcha-text').innerText;
    
    if (!name || !phone || !email || !password) return alert("Vui lòng điền đầy đủ thông tin!");
    if (captchaInput.toUpperCase() !== currentRegCaptcha.toUpperCase()) return alert("Mã xác thực Captcha không khớp!");
    
    const birthDay = document.getElementById('reg-birth-day').value;
    const birthMonth = document.getElementById('reg-birth-month').value;
    const birthYear = document.getElementById('reg-birth-year').value;
    if (!birthDay || !birthMonth || !birthYear) return alert("Vui lòng chọn đầy đủ ngày tháng năm sinh!");

    const genderActive = document.querySelector('input[name="gender"]:checked');
    const genderValue = genderActive ? genderActive.value : "Nam";

    const payload = {
        name: name, phone: phone, email: email, password: password,
        birthDay: parseInt(birthDay), birthMonth: parseInt(birthMonth), birthYear: parseInt(birthYear), gender: genderValue
    };

    fetch('http://localhost:8080/api/register/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    .then(res => { if (!res.ok && res.status !== 400) throw new Error("Server lỗi!"); return res.json(); })
    .then(response => {
        if (response.status === 'success') {
            alert(response.message);
            registeredEmailCache = response.email; 
            closeAuthModal(); 
            const otpModal = document.getElementById('otp-modal');
            if (otpModal) otpModal.classList.add('open');
        } else { alert(response.message); }
    }).catch(err => { console.error(err); alert("Lỗi kết nối Backend!"); });
}

function submitOtpVerification() {
    const otpInput = document.getElementById('otp-input-field').value.trim();
    if (!otpInput) return alert("Vui lòng nhập mã số OTP gồm 6 chữ số!");
    if (!registeredEmailCache) return alert("Không tìm thấy thông tin email đăng ký hợp lệ. Vui lòng thử lại!");

    fetch('http://localhost:8080/api/register/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmailCache, otp: otpInput })
    })
    .then(res => { if (!res.ok && res.status !== 401 && res.status !== 400) throw new Error("Lỗi hệ thống!"); return res.json(); })
    .then(response => {
        if (response.status === 'success') {
            alert(response.message); 
            document.getElementById('otp-modal').classList.remove('open');
            openAuthModal(); toggleAuthTab('login');
            document.getElementById('auth-username').value = registeredEmailCache;
            document.getElementById('otp-input-field').value = ""; 
        } else { alert(response.message); }
    }).catch(err => { console.error(err); alert("Lỗi xác thực OTP!"); });
}

function closeOtpModal() { document.getElementById('otp-modal').classList.remove('open'); }

// --- ĐĂNG XUẤT ---
function handleCgvLogout(e) { e.stopPropagation(); document.getElementById('logout-confirm-modal').classList.add('open'); }
function closeLogoutConfirmModal() { document.getElementById('logout-confirm-modal').classList.remove('open'); }

function confirmCgvLogoutAction() {
    isUserLoggedInState = false; closeLogoutConfirmModal();
    const authLinkBox = document.getElementById('top-bar-auth-link');
    authLinkBox.removeAttribute('style'); authLinkBox.onclick = openAuthModal;
    authLinkBox.innerHTML = `<span class="sub-nav-icon">👤</span> ĐĂNG NHẬP/ ĐĂNG KÝ`;
    document.getElementById('top-bar-ticket-link').innerHTML = `<span class="sub-nav-icon">🎬</span> VÉ CỦA TÔI`;
    if (typeof switchCgvTab === 'function') switchCgvTab('panel-movies', 'now_showing');
}

function confirmLogoutAction(e) {
    if(e) e.stopPropagation();
    if(confirm("Bạn có chắc chắn muốn đăng xuất phiên làm việc này không?")) {
        sessionStorage.clear(); isUserLoggedInState = false; location.reload(); 
    }
}

function updateTopBarMenu(fullName, roleName) {
    const authLinkBox = document.getElementById('top-bar-auth-link');
    if (authLinkBox) {
        authLinkBox.removeAttribute('onclick');
        authLinkBox.innerHTML = `
            <span class="sub-nav-icon">👤</span> [${roleName}] ${fullName.toUpperCase()}! 
            <span onclick="confirmLogoutAction(event)" style="color: #e71a0f; margin-left: 8px; cursor: pointer; text-decoration: underline; font-weight: bold;">[THOÁT]</span>
        `;
    }
}