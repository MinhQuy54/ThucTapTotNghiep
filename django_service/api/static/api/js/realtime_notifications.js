document.addEventListener("DOMContentLoaded", function () {
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsUrl = protocol + window.location.host + "/ws/notifications/";

    let socket;
    
    function connect() {
        socket = new WebSocket(wsUrl);

        socket.onopen = function () {
            console.log("🟢 [Real-time] Đã kết nối với hệ thống thông báo!");
        };

        socket.onmessage = function (e) {
            const data = JSON.parse(e.data);
            
            // 1. Cập nhật số lượng trên icon chuông
            const indicator = document.querySelector(".bg-primary-600");
            if (indicator) {
                let currentCount = parseInt(indicator.innerText) || 0;
                indicator.innerText = currentCount + 1;
                indicator.style.display = 'flex';
            }

            // 2. Hiện thông báo dạng Toast mượt mà ở góc phải dưới
            const toast = document.createElement("div");
            toast.style.position = "fixed";
            toast.style.bottom = "20px";
            toast.style.right = "20px";
            toast.style.backgroundColor = "#10B981"; // Màu xanh lá cây mướt
            toast.style.color = "white";
            toast.style.padding = "15px 25px";
            toast.style.borderRadius = "8px";
            toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            toast.style.zIndex = "9999";
            toast.style.fontWeight = "bold";
            toast.style.fontFamily = "sans-serif";
            toast.style.transition = "opacity 0.5s ease-in-out";
            toast.innerHTML = "📦 " + data.message;
            
            document.body.appendChild(toast);

            // Tự động mờ dần và biến mất sau 5 giây
            setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        };


        socket.onclose = function (e) {
            console.warn("🔴 [Real-time] Mất kết nối. Thử lại sau 5 giây...");
            setTimeout(connect, 5000); // Tự động kết nối lại
        };

        socket.onerror = function (err) {
            console.error("❌ [Real-time] Lỗi WebSocket", err);
            socket.close();
        };
    }

    connect();
});
