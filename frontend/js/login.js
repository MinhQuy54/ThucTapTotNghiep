document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const hideLoading = antd.message.loading('Đang xử lý đăng nhập...');
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

        // 1. Lưu thông tin đăng nhập
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);

        // 2. ĐỒNG BỘ GIỎ HÀNG ẨN DANH (GUEST CART) LÊN SERVER TRƯỚC KHI CHUYỂN TRANG
        let guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
        if (guestCart.length > 0) {
            console.log("🛒 Đồng bộ giỏ hàng... số lượng item:", guestCart.length);
            try {
                const syncPromises = guestCart.map(item => {
                    console.log("📦 Gửi sản phẩm:", {
                        productId: item.product.id,
                        quantity: item.quantity
                    });
                    
                    return fetch("/api/cart", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${data.access}`
                        },
                        body: JSON.stringify({
                            product_id: item.product.id,
                            quantity: item.quantity
                        })
                    }).then(res => {
                        if (!res.ok) {
                            console.error("❌ Lỗi response:", res.status, res.statusText);
                        }
                        return res;
                    });
                });
                
                const results = await Promise.all(syncPromises);
                console.log("✅ Kết quả đồng bộ:", results.map(r => r.status));
                
                // Đồng bộ xong thì xóa giỏ hàng ẩn danh đi
                localStorage.removeItem('guest_cart');
                console.log("✅ Đã xóa guest_cart");
            } catch (syncError) {
                console.error("❌ Lỗi khi đồng bộ giỏ hàng:", syncError);
            }
        }

        // 3. Thông báo thành công và chuyển trang
        antd.notification.success({
            message: 'Đăng nhập thành công',
            description: 'Chào mừng bạn đến với Veggie!',
            placement: 'topRight',
            duration: 4
        });

        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || "index.html";

        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 2000);

    } catch (error) {
        if (typeof hideLoading === 'function') hideLoading();
        antd.message.error("Lỗi kết nối server!");
    }
});

window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const activatedStatus = urlParams.get('activated');
    const oauthStatus = urlParams.get('oauth');

    if (activatedStatus === 'success') {
        antd.notification.success({
            message: 'Kích hoạt thành công!',
            description: 'Tài khoản của bạn đã sẵn sàng. Hãy đăng nhập ngay!',
            placement: 'topRight'
        });
    } else if (activatedStatus === 'error') {
        antd.message.error('Link kích hoạt không hợp lệ hoặc đã hết hạn.');
    } else if (oauthStatus === 'error') {
        antd.message.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
};