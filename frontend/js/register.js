document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const password = document.getElementById("password").value;

    // Logic Validate giống Backend
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < 6) {
        antd.message.error("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        antd.message.warning("Mật khẩu cần có chữ hoa, chữ thường và số!");
        return;
    }

    const payload = {
        firstname: document.getElementById("firstname").value,
        lastname: document.getElementById("lastname").value,
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: password
    };

    const hideLoading = antd.message.loading('Đang xử lý đăng ký...',);

    try {
        const res = await fetch('/api/register/', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        hideLoading();

        if (!res.ok) {
            const errorMsg = data.password?.[0] || data.email?.[0] || data.username?.[0] || "Đăng ký thất bại";
            antd.message.error(errorMsg);
            return;
        }

        // Store guest address for later use (will be saved on first login)
        // The address will be saved when user logs in for the first time
        
        // THÔNG BÁO THÀNH CÔNG KIỂU ANT DESIGN
        antd.notification.success({
            message: 'Đăng ký thành công ',
            description: 'Vui lòng kiểm tra Email của bạn để kích hoạt tài khoản trước khi đăng nhập.',
            placement: 'topRight',
            duration: 6
        });

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);

    } catch (err) {
        hideLoading();
        antd.message.error("Lỗi kết nối server!");
    }
});