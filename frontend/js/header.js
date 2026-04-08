const DEFAULT_HEADER_AVATAR = `img/IMG_4420.JPG`;

fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById("header").innerHTML = html;
        // Chờ một chút để DOM ổn định rồi mới bắt sự kiện
        setTimeout(updateHoverMenu, 100);
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

    } else {
        // TRƯỜNG HỢP: CHƯA ĐĂNG NHẬP
        authText.innerText = "Đăng nhập";
        authText.href = "login.html";
        authText.classList.remove("text-danger");
        authText.onclick = null;
        applyHeaderAvatar();

        if (personLink) personLink.href = "login.html";
    }
}
