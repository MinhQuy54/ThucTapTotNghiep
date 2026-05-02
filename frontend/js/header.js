const DEFAULT_HEADER_AVATAR = `img/IMG_4420.JPG`;
let notificationSocket = null;
let notificationReconnectTimer = null;

fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById("header").innerHTML = html;
        setTimeout(() => {
            updateHoverMenu();
            initNotifications();
        }, 100);

        if (!document.querySelector('script[src*="cart.js"]')) {
            const script = document.createElement("script");
            script.src = "./js/cart.js";
            document.body.appendChild(script);
        } else if (typeof window.runCartInit === "function") {
            window.runCartInit();
        }
    });

window.addEventListener("user-profile-updated", (event) => {
    applyHeaderAvatar(event.detail?.avatar);
});

function resolveAvatarUrl(avatarPath) {
    if (!avatarPath) {
        return DEFAULT_HEADER_AVATAR;
    }

    if (/^(data:|blob:)/i.test(avatarPath)) {
        return avatarPath;
    }

    if (/^https?:/i.test(avatarPath)) {
        try {
            const parsedUrl = new URL(avatarPath);

            if (parsedUrl.pathname.startsWith("/media/")) {
                return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
            }

            return parsedUrl.href;
        } catch (error) {
            console.error(error);
            return avatarPath;
        }
    }

    return avatarPath.startsWith("/") ? avatarPath : `/${avatarPath}`;
}

function applyHeaderAvatar(avatarPath) {
    const avatarImage = document.getElementById("header-avatar-image");

    if (!avatarImage) {
        return;
    }

    avatarImage.src = resolveAvatarUrl(avatarPath);
}

async function loadHeaderUserProfile(accessToken) {
    try {
        const res = await fetch('/api/user/', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!res.ok) {
            throw new Error("Không thể tải thông tin người dùng");
        }

        const user = await res.json();
        applyHeaderAvatar(user.avatar);
    } catch (error) {
        console.error(error);
        applyHeaderAvatar();
    }
}

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
        loadHeaderUserProfile(accessToken);

        authText.onclick = null;

        authText.addEventListener('click', function (e) {
            e.preventDefault();

            // Xóa sạch dấu vết login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("username");
            applyHeaderAvatar();

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

        const viewVouchersBtn = document.getElementById("view-vouchers-btn");
        if (viewVouchersBtn) {
            viewVouchersBtn.style.display = "block";
            viewVouchersBtn.onclick = async function (e) {
                const container = document.getElementById("voucher-list-container");
                if (!container) return;

                container.innerHTML = `<div class="text-center py-4 text-muted"><div class="spinner-border text-success" role="status"></div><div class="mt-2">Đang tải voucher...</div></div>`;

                try {
                    const res = await fetchWithAuth('/api/userVoucher/GetUserVouchers');
                    if (!res.ok) throw new Error("Lấy danh sách lỗi");

                    const resData = await res.json();
                    // Api đang trả về mảng kq trực tiếp thay vì bọc qua dât, phụ thuộc backend của bạn
                    const vouchers = Array.isArray(resData) ? resData : (resData.data || []);

                    if (vouchers.length === 0) {
                        container.innerHTML = `<div class="text-center py-5"><i class="fa-solid fa-ticket fa-3x text-muted mb-3 opacity-50"></i><h6>Không có voucher nào trong ví</h6></div>`;
                        return;
                    }

                    // Nhóm các voucher trùng mã
                    const groupedVouchers = {};
                    vouchers.forEach(v => {
                        const code = v.code || v.Code;
                        if (!groupedVouchers[code]) {
                            groupedVouchers[code] = { ...v, count: 1 };
                        } else {
                            groupedVouchers[code].count += 1;
                        }
                    });

                    let html = `<div class="list-group list-group-flush shadow-sm rounded">`;
                    Object.values(groupedVouchers).forEach(v => {
                        const dateEnd = new Date(v.endDate || v.EndDate).toLocaleDateString('vi-VN');
                        const code = v.code || v.Code;
                        const type = v.discountType || v.DiscountType;
                        const val = v.discountValue || v.DiscountValue;
                        const maxVal = v.maxDiscount || v.MaxDiscount;
                        const count = v.count;

                        let textPromo = type === 'percentage'
                            ? `Giảm ${val}% (Tối đa ${(maxVal).toLocaleString('vi-VN')}đ)`
                            : `Giảm ${(val).toLocaleString('vi-VN')}đ`;

                        const badgeHtml = count > 1 ? `<span class="badge bg-danger ms-2" style="font-size: 0.75rem;">x${count}</span>` : '';

                        html += `
                            <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 mb-2 rounded border border-success border-opacity-25" style="background: #f1f8e9;">
                                <div>
                                    <h6 class="mb-1 text-success fw-bold d-flex align-items-center"><i class="fa-solid fa-tags me-2"></i>${code} ${badgeHtml}</h6>
                                    <p class="mb-1 small">${textPromo}</p>
                                    <small class="text-muted">HSD: ${dateEnd}</small>
                                </div>
                                <div>
                                    <button class="btn btn-sm btn-outline-success rounded-pill fw-bold" onclick="navigator.clipboard.writeText('${code}'); alert('Đã sao chép: ${code}');">Sao chép</button>
                                </div>
                            </div>
                        `;
                    });
                    html += `</div>`;
                    container.innerHTML = html;
                } catch (error) {
                    console.error("Lỗi khi fetch voucher:", error);
                    container.innerHTML = `<div class="text-center py-4 text-danger">Có lỗi xảy ra. Vui lòng thử lại sau.</div>`;
                }
            };
        }

    } else {
        // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP
        authText.innerText = "Đăng nhập";
        authText.href = "login.html";
        authText.classList.remove("text-danger");
        authText.onclick = null;
        applyHeaderAvatar();

        const viewVouchersBtn = document.getElementById("view-vouchers-btn");
        if (viewVouchersBtn) viewVouchersBtn.style.display = "none";

        if (personLink) personLink.href = "login.html";
    }
}

function initNotifications() {
    const notificationBtn = document.getElementById("notification-btn");
    const dropdown = document.getElementById("notification-dropdown");
    const markAllReadBtn = document.getElementById("mark-all-read");

    if (!notificationBtn || !dropdown) return;

    // Toggle dropdown
    notificationBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        dropdown.classList.toggle("active");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function () {
        dropdown.classList.remove("active");
    });

    dropdown.addEventListener("click", function (e) {
        e.stopPropagation();
    });

    if (markAllReadBtn) {
        markAllReadBtn.onclick = async function (e) {
            e.preventDefault();
            // Implement mark all read if needed, or just handle individual ones
            const unreadItems = document.querySelectorAll(".notification-item.unread");
            for (let item of unreadItems) {
                const id = item.getAttribute("data-id");
                await markAsRead(id);
            }
            fetchNotifications();
        };
    }

    // Load data if logged in
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
        fetchNotifications();
        setupNotificationWebSocket(accessToken);
    } else {
        notificationBtn.style.display = "none";
    }
}


async function fetchNotifications() {
    if (typeof fetchWithAuth !== "function") {
        console.warn("fetchWithAuth chưa được load, bỏ qua tải thông báo.");
        return;
    }

    try {
        const res = await fetchWithAuth('/api/notification/');
        if (!res.ok) throw new Error("Lấy thông báo thất bại");
        const notifications = await res.json();
        renderNotifications(notifications);
    } catch (error) {
        console.error("Lỗi fetch notification:", error);
    }
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById("notification-list");
    const notificationCount = document.getElementById("notification-count");

    if (!notificationList) return;

    if (notifications.length === 0) {
        notificationList.innerHTML = `<div class="text-center py-4 text-muted"><p class="small mb-0">Không có thông báo mới</p></div>`;
        notificationCount.style.display = 'none';
        return;
    }

    // Sort by latest
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    let html = '';
    notifications.forEach(n => {
        const icon = n.type.toLowerCase().includes('order') ? 'local_shipping' : (n.type.toLowerCase().includes('review') ? 'chat_bubble' : 'notifications');
        const typeClass = n.type.toLowerCase().includes('order') ? 'order' : (n.type.toLowerCase().includes('review') ? 'review' : 'promo');

        html += `
            <div class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" onclick="handleNotificationClick(${n.id}, ${n.is_read})">
                <div class="notification-icon-wrapper ${typeClass}">
                    <span class="material-symbols-outlined">${icon}</span>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${n.type}</div>
                    <div class="notification-desc">${n.message}</div>
                    <div class="notification-time">${timeAgo(n.created_at)}</div>
                </div>
                <div class="d-flex flex-column align-items-center gap-2">
                    ${!n.is_read ? '<div class="unread-dot"></div>' : ''}
                    <button class="btn btn-sm delete-notification p-0" onclick="deleteNotification(event, ${n.id})">
                        <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
                    </button>
                </div>
            </div>
        `;
    });
    notificationList.innerHTML = html;

    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (unreadCount > 0) {
        notificationCount.innerText = unreadCount > 9 ? '9+' : unreadCount;
        notificationCount.style.display = 'block';
    } else {
        notificationCount.style.display = 'none';
    }
}

async function handleNotificationClick(id, isRead) {
    if (!isRead) {
        await markAsRead(id);
    }
    // Redirect logic if needed based on type
    // window.location.href = '...';
}

async function markAsRead(id) {
    try {
        const res = await fetchWithAuth(`/api/notification/read/${id}/`, {
            method: "POST"
        });
        if (res.ok) {
            fetchNotifications();
        }
    } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
    }
}

async function deleteNotification(event, id) {
    event.stopPropagation();
    closeNotificationDropdown();

    const confirmed = await confirmDeleteNotification();
    if (!confirmed) return;

    try {
        const res = await fetchWithAuth(`/api/notification/${id}/`, {
            method: "DELETE"
        });
        if (res.ok) {
            fetchNotifications();
        }
    } catch (error) {
        console.error("Lỗi xóa thông báo:", error);
    }
}

function closeNotificationDropdown() {
    const dropdown = document.getElementById("notification-dropdown");
    if (dropdown) {
        dropdown.classList.remove("active");
    }
}

function confirmDeleteNotification() {
    if (typeof antd !== "undefined" && antd.Modal && typeof antd.Modal.confirm === "function") {
        return new Promise((resolve) => {
            antd.Modal.confirm({
                title: "Xóa thông báo?",
                content: "Thông báo này sẽ bị xóa khỏi danh sách của bạn.",
                okText: "Xóa",
                cancelText: "Hủy",
                okButtonProps: { danger: true },
                onOk: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    }

    return Promise.resolve(window.confirm("Bạn có chắc chắn muốn xóa thông báo này?"));
}
// Open WebSocket
function setupNotificationWebSocket(accessToken) {
    if (!accessToken) return;

    if (notificationSocket && (
        notificationSocket.readyState === WebSocket.OPEN ||
        notificationSocket.readyState === WebSocket.CONNECTING
    )) {
        return;
    }

    if (notificationReconnectTimer) {
        clearTimeout(notificationReconnectTimer);
        notificationReconnectTimer = null;
    }

    const wsUrl = getNotificationWebSocketUrl();
    console.log("Connecting to WebSocket:", wsUrl);

    const socket = new WebSocket(`${wsUrl}?token=${encodeURIComponent(accessToken)}`);
    notificationSocket = socket;
    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        console.log("Real-time notification:", data);

        // Show browser notification or update UI
        if (typeof antd !== 'undefined') {
            antd.notification.info({
                message: 'Thông báo mới',
                description: data.message,
                placement: 'topRight'
            });
        }

        // Refresh the list
        fetchNotifications();
    };

    socket.onerror = function (error) {
        console.error("Notification socket error:", error);
    };

    socket.onclose = function (e) {
        if (notificationSocket === socket) {
            notificationSocket = null;
        }

        if (!localStorage.getItem("access_token")) return;

        console.warn(`Notification socket closed (${e.code}${e.reason ? `: ${e.reason}` : ""}). Reconnecting in 5s...`);
        notificationReconnectTimer = setTimeout(async () => {
            let accessToken = localStorage.getItem("access_token");

            if (typeof refreshAccessToken === "function") {
                try {
                    accessToken = await refreshAccessToken();
                } catch (error) {
                    console.error("Không thể refresh token cho WebSocket:", error);
                    return;
                }
            }

            setupNotificationWebSocket(accessToken);
        }, 5000);
    };
}

function getNotificationWebSocketUrl() {
    if (typeof CONFIG !== "undefined" && CONFIG.WS_URL) {
        return `${CONFIG.WS_URL.replace(/\/$/, "")}/notifications/`;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isLocalHost = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    const host = isLocalHost && window.location.port !== "8080"
        ? `${window.location.hostname || "localhost"}:8080`
        : window.location.host;

    return `${protocol}//${host}/ws/notifications/`;
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "Vừa xong";
}
