const requestForm = document.getElementById('requestForm');
const resetForm = document.getElementById('resetForm');

if (requestForm) {
    requestForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;

        const hideLoading = antd.message.loading('Đang gửi yêu cầu...', 0);

        try {
            const res = await fetch('/api/reset-password/', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            hideLoading();

            if (res.ok && data.reset_link) {
                antd.notification.success({
                    message: 'Yêu cầu được chấp thuận',
                    description: React.createElement('div', null,
                        'Vui lòng kiểm tra email hoặc bấm vào đây: ',
                        React.createElement('a', {
                            href: data.reset_link,
                            target: '_blank',
                            style: { color: '#89b500', fontWeight: 'bold' }
                        }, 'Đặt lại mật khẩu')
                    ),
                    placement: 'topRight',
                    duration: 10
                });
            } else {
                antd.message.error(data.detail || "Email không tồn tại!");
            }
        } catch (error) {
            hideLoading();
            antd.message.error("Lỗi kết nối máy chủ!");
            console.error(error);
        }
    });
}


if (resetForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    resetForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const password = document.getElementById("password").value;
        const confirm = document.getElementById("confirm_password").value;

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

        if (!token) {
            antd.message.error("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!");
            return;
        }

        if (password !== confirm) {
            antd.message.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        const hideLoading = antd.message.loading('Đang cập nhật mật khẩu...', 0);

        try {
            const res = await fetch('/api/reset-password-confirm/', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: token,
                    password: password,
                    confirm_password: confirm
                })
            });

            const data = await res.json();
            hideLoading();

            if (res.ok) {
                antd.notification.success({
                    message: 'Thành công!',
                    description: 'Mật khẩu của bạn đã được cập nhật. Hệ thống sẽ chuyển về trang đăng nhập sau 2 giây.',
                    placement: 'topRight',
                });

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            } else {
                antd.message.error(data.error || data.detail || "Cập nhật thất bại!");
            }
        } catch (error) {
            hideLoading();
            antd.message.error("Lỗi kết nối đến server!");
        }
    });
}