document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("notification-bell-icon")) {
        return;
    }

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
            const content = data.content || data; // Handle different payload structures
            
            // 1. Cập nhật số lượng trên icon chuông
            const badgeWrapper = document.getElementById("notification-badge-wrapper");
            const indicator = document.getElementById("notification-unread-count");
            const bellIcon = document.getElementById("notification-bell-icon");

            if (indicator && badgeWrapper) {
                let currentCount = parseInt(indicator.innerText) || 0;
                let newCount = currentCount + 1;
                indicator.innerText = newCount > 99 ? "99+" : newCount;
                badgeWrapper.classList.remove("hidden");
                
                if (bellIcon) {
                    bellIcon.innerText = "notifications_active";
                    bellIcon.classList.add("text-primary-600", "dark:text-primary-400");
                }
            }

            // 2. Thêm vào danh sách dropdown nếu đang mở hoặc tồn tại
            const container = document.getElementById("notification-items-container");
            if (container) {
                const newItem = document.createElement("div");
                // Giả lập cấu hình icon dựa trên type
                let icon = "notifications";
                let iconClass = "bg-base-100 text-base-700";
                
                if (content.type === "ORDER") {
                    icon = "receipt_long";
                    iconClass = "bg-blue-100 text-blue-700";
                } else if (content.type === "CONTACT") {
                    icon = "contact_mail";
                    iconClass = "bg-amber-100 text-amber-700";
                } else if (content.type === "REVIEW") {
                    icon = "rate_review";
                    iconClass = "bg-emerald-100 text-emerald-700";
                }

                // ID của thông báo mới từ server
                const notificationId = content.id || "";

                newItem.innerHTML = `
                    <a href="/admin/api/notification/" data-id="${notificationId}" class="flex gap-3 border-b border-base-200 px-4 py-3 transition-colors hover:bg-base-50 bg-primary-50/50">
                        <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}">
                            <span class="material-symbols-outlined text-[20px]">${icon}</span>
                        </span>
                        <span class="min-w-0 flex-1">
                            <span class="flex items-start justify-between gap-3">
                                <span class="flex items-center gap-2 truncate text-sm font-semibold text-font-important-light">
                                    Thông báo mới
                                    <span class="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-primary-600"></span>
                                </span>
                                <span class="shrink-0 text-[11px] text-font-subtle-light">${content.created_at || 'Vừa xong'}</span>
                            </span>
                            <span class="mt-1 block line-clamp-2 text-xs leading-5 text-font-default-light">
                                ${content.message}
                            </span>
                        </span>
                    </a>
                `;
                container.prepend(newItem.firstElementChild);
            }

            // 3. Hiện thông báo dạng Toast
            showToast(content.message);
        };

        function showToast(message) {
            const toast = document.createElement("div");
            toast.style.position = "fixed";
            toast.style.bottom = "20px";
            toast.style.right = "20px";
            toast.style.backgroundColor = "#10B981";
            toast.style.color = "white";
            toast.style.padding = "15px 25px";
            toast.style.borderRadius = "8px";
            toast.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            toast.style.zIndex = "9999";
            toast.style.fontWeight = "bold";
            toast.style.transition = "opacity 0.5s ease-in-out";
            toast.innerHTML = "📦 " + message;
            
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = "0";
                setTimeout(() => toast.remove(), 500);
            }, 5000);
        }

        // 4. Xử lý click để đánh dấu đã đọc
        document.addEventListener("click", function(e) {
            const item = e.target.closest("#notification-items-container a");
            if (item) {
                const notificationId = item.dataset.id;
                if (notificationId) {
                    fetch(`/api/notification/read/${notificationId}/`, {
                        method: "POST",
                        headers: {
                            "X-CSRFToken": getCookie("csrftoken")
                        }
                    });
                }
            }
        });

        function getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== "") {
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + "=")) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }


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
