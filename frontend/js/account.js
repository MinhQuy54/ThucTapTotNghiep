let editingAddressId = null;
document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    updateAccount();
    loadAddress();
    loadOrder();
});

function renderStatus(status) {
    switch (status) {
        case 1:
            return '<span class="badge-waiting">Chờ xác nhận</span>';
        case 2:
            return '<span class="badge-payment">Đã xác nhận</span>';
        case 3:
            return '<span class="badge bg-info">Đang giao</span>';
        case 4:
            return '<span class="badge bg-success">Đã giao</span>';
        case 5:
            return '<span class="badge bg-danger">Đã hủy</span>';
        case 6:
            return '<span class="badge bg-secondary">Hoàn trả</span>';
        default:
            return '<span class="badge bg-dark">Không xác định</span>';
    }
}
const saveAddressBtn = document.getElementById('save-address-btn');
saveAddressBtn.addEventListener("click", addAddress);

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

async function loadAddress() {
    const addressTable = document.getElementById("address-table-body");
    const token = localStorage.getItem("access_token");
    addressTable.innerHTML = "";
    if (!token) {
        window.location.href = 'login.html';
    }

    const res = await fetch('/api/address/', {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })

    if (!res.ok) {
        antd.notification.error({
            message: 'Lỗi',
            placement: 'topRight',
            duration: 4
        });
    }

    const data = await res.json();

    data.forEach(addr => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${addr.full_name}</td>
            <td>${addr.address}</td>
            <td>${addr.city}</td>
            <td>${addr.phone}</td>
            <td>${addr.default ? '<span class="badge bg-success" style="font-size: 0.7rem;">MẶC ĐỊNH</span>' : ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteAddress(${addr.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning border-0" onclick="updateAddress(${addr.id})">
                    <i class="fa-solid fa-pen"></i>
                </button>
            </td>
        `;
        addressTable.appendChild(tr);
    })

}

function openAddModal() {
    editingAddressId = null;

    document.getElementById('addr-name').value = "";
    document.getElementById('addr-phone').value = "";
    document.getElementById('addr-city').value = "";
    document.getElementById('addr-detail').value = "";
    document.getElementById('addr-default').checked = false;
}
async function addAddress() {
    const payload = {
        full_name: document.getElementById('addr-name').value.trim(),
        phone: document.getElementById('addr-phone').value.trim(),
        city: document.getElementById('addr-city').value.trim(),
        address: document.getElementById('addr-detail').value.trim(),
        default: document.getElementById('addr-default').checked
    };

    if (!payload.full_name || !payload.phone || !payload.address) {
        antd.notification.warning({
            message: 'Thiếu thông tin',
            description: 'Vui lòng nhập đầy đủ thông tin'
        });
        return;
    }

    const token = localStorage.getItem("access_token");

    try {
        let url = '/api/address/';
        let method = "POST";

        if (editingAddressId) {
            url = `/api/address/${editingAddressId}/`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            antd.notification.success({
                message: 'Thành công',
                description: editingAddressId ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công'
            });

            const modalEl = document.getElementById('addressModal');
            let modal = bootstrap.Modal.getInstance(modalEl);

            if (!modal) {
                modal = new bootstrap.Modal(modalEl);
            }

            modal.hide();
            editingAddressId = null;

            document.getElementById('addr-name').value = "";
            document.getElementById('addr-phone').value = "";
            document.getElementById('addr-city').value = "";
            document.getElementById('addr-detail').value = "";
            document.getElementById('addr-default').checked = false;

            loadAddress();

        } else {
            antd.notification.error({
                message: 'Lỗi',
                description: data.error || JSON.stringify(data)
            });
        }

    } catch (err) {
        console.error(err);
    }
}

async function deleteAddress(id) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    antd.Modal.confirm({
        title: 'Xác nhận xóa',
        content: 'Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.',
        okText: 'Xóa ngay',
        okType: 'danger',
        cancelText: 'Hủy bỏ',
        async onOk() {
            try {
                const res = await fetch(`/api/address/${id}/`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    antd.notification.success({
                        message: 'Thành công',
                        description: 'Địa chỉ đã được xóa',
                        placement: 'topRight',
                        duration: 3
                    });
                    loadAddress();
                } else {
                    const err = await res.json();
                    antd.notification.error({
                        message: 'Lỗi',
                        description: err.error || "Không thể xóa địa chỉ",
                        placement: 'topRight'
                    });
                }
            } catch (error) {
                console.error(error);
                antd.notification.error({
                    message: 'Lỗi hệ thống',
                    description: 'Không thể kết nối server'
                });
            }
        }
    });
}

async function updateAddress(id) {
    const token = localStorage.getItem("access_token");
    editingAddressId = id;

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch(`/api/address/${id}/`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const addr = await res.json();

        document.getElementById('addr-name').value = addr.full_name;
        document.getElementById('addr-phone').value = addr.phone;
        document.getElementById('addr-city').value = addr.city;
        document.getElementById('addr-detail').value = addr.address;
        document.getElementById('addr-default').checked = addr.default;

        // mở modal
        const modalEl = document.getElementById('addressModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

    } catch (error) {
        console.error(error);
    }
}


async function loadOrder() {
    const token = localStorage.getItem("access_token");
    const orderTable = document.getElementById('order-table');
    orderTable.innerHTML = '';
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const res = await fetch('/api/order/', {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    if (!data || data.length === 0) {
        OrderTable.innerHTML =
            `<tr>
                 <td colspan="4" class="py-4 text-muted" id="order-table">Bạn chưa có đơn hàng nào.</td>
             </tr>`;
    }
    data.forEach(order => {
        const tr = document.createElement('tr');
        const price = parseFloat(order.total_price);
        const status = renderStatus(order.status)
        tr.innerHTML = `
                <td>#${order.id}</td>
                <td>${new Date(order.created_at).toLocaleString("vi-VN")}</td>
                <td>${status}</td>
                <td class="fw-bold">${price.toLocaleString('vi-VN')}đ</td>
                <td>
                    <a class="btn btn-sm btn-outline-danger border-0" href='orderdetail.html?id=${order.id}'>
                    Xem chi tiết
                </a></td>
                `;
        orderTable.appendChild(tr);
    })
}

async function loadDetailOrder() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

}