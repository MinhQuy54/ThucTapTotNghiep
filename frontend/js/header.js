const DEFAULT_HEADER_AVATAR = `img/IMG_4420.JPG`;

fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById("header").innerHTML = html;
        // Chờ một chút để DOM ổn định rồi mới bắt sự kiện
        setTimeout(updateHoverMenu, 100);

        // Load cart.js into global context if it's not present to support mini-cart on all pages
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

                        const isPercent = (type === 'percentage' || type === 'percent');
                        let textPromo = isPercent
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
