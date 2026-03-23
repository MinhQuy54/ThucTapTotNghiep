fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById("header").innerHTML = html;
        // Chờ một chút để DOM ổn định rồi mới bắt sự kiện
        setTimeout(updateHoverMenu, 100);
    });

function updateHoverMenu() {
    const accessToken = localStorage.getItem("access_token");
    const authText = document.getElementById("auth-status-text");
    const personLink = document.getElementById("person-link");

    if (!authText) return; // Bảo vệ nếu không tìm thấy element

    if (accessToken) {
        // TRƯỜNG HỢP: ĐÃ ĐĂNG NHẬP
        authText.innerText = "Đăng xuất";
        authText.href = "javascript:void(0)";
        authText.classList.add("text-danger");

        authText.onclick = null;

        authText.addEventListener('click', function (e) {
            e.preventDefault();

            // Xóa sạch dấu vết login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("username");

            // Gọi Ant Design - Đảm bảo thư viện đã load ở file HTML chính
            if (typeof antd !== 'undefined') {
                antd.notification.success({
                    message: 'Đăng xuất thành công',
                    description: 'Hẹn gặp lại bạn tại Veggie!',
                    placement: 'topRight',
                    duration: 2
                });
            } else {
                console.error("Ant Design chưa load kịp!");
            }

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        });

        if (personLink) personLink.href = "account.html";

    } else {
        // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP
        authText.innerText = "Đăng nhập";
        authText.href = "login.html";
        authText.classList.remove("text-danger");
        authText.onclick = null;

        if (personLink) personLink.href = "login.html";
    }
}