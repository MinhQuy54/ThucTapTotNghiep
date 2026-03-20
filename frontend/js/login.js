document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const hideLoading = antd.message.loading('Đang xử lý đăng ký...',);
        const response = await fetch(`/api/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();
        hideLoading();

        if (!response.ok) {
            antd.message.error("Đăng nhập thất bại! Hãy kiểm tra lại thông tin");
            return;
        }

        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);

        antd.notification.success({
            message: 'Đăng nhập thành công ',
            description: 'Chào mừng bạn đến với Veggie!',
            placement: 'topRight',
            duration: 4
        });

        setTimeout(() => {
            window.location.href = "index.html";
        }, 2000);


    } catch (error) {
        hideLoading();
        antd.message.error("Lỗi kết nối server!");
    }
})