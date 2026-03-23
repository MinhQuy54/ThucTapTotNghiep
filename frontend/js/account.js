document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    updateAccount();
});

async function loadUserProfile() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const res = await fetch('/api/user/', {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error("Unauthorized");

        const user = await res.json();

        document.getElementById('fname').value = user.first_name || "";
        document.getElementById('lname').value = user.last_name || "";
        document.getElementById('email').value = user.email || "";
        document.getElementById('fullname').value =
            `${user.first_name || ""} ${user.last_name || ""}`.trim();

    } catch (err) {
        console.error(err);
        window.location.href = "login.html";
    }
}

function updateAccount() {
    const token = localStorage.getItem("access_token");
    const accountForm = document.getElementById('account-details-form');

    if (!token || !accountForm) return;

    accountForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const updateData = {
            first_name: document.getElementById('fname').value,
            last_name: document.getElementById('lname').value,
            email: document.getElementById('email').value
        };

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (currentPassword || newPassword || confirmPassword) {
            updateData.current_password = currentPassword;
            updateData.new_password = newPassword;
            updateData.confirm_password = confirmPassword;
        }

        try {
            const res = await fetch('/api/user/update/', {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await res.json();

            if (res.ok) {
                antd.notification.success({
                    message: 'Cập nhật thành công',
                    description: 'Thông tin tài khoản đã được thay đổi',
                    placement: 'topRight',
                    duration: 3
                });

                loadUserProfile();

                document.getElementById('current-password').value = "";
                document.getElementById('new-password').value = "";
                document.getElementById('confirm-password').value = "";

            } else {
                antd.notification.error({
                    message: 'Lỗi',
                    description: data.error || JSON.stringify(data),
                    placement: 'topRight',
                    duration: 4
                });
            }

        } catch (err) {
            console.error(err);
            antd.notification.error({
                message: 'Lỗi hệ thống',
                description: 'Không thể kết nối server',
                placement: 'topRight'
            });
        }
    });
}

function handleLogout() {
    const logoutLink = document.getElementById("logout-link");


}