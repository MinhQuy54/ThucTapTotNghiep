document.addEventListener("DOMContentLoaded", loadDetailOrder);

function setKvText(id, value) {
    const row = document.getElementById(id);
    const valueEl = row ? row.querySelector(".order-value") : null;
    if (!valueEl) return;
    const normalized = value === null || value === undefined || value === "" ? "---" : value;
    valueEl.textContent = normalized;
}

function setKvHtml(id, html) {
    const row = document.getElementById(id);
    const valueEl = row ? row.querySelector(".order-value") : null;
    if (!valueEl) return;
    valueEl.innerHTML = html ?? "";
}

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

function canReview(status) {
    return status === 4;
}
async function loadDetailOrder() {
    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (!orderId) {
        alert("Không tìm thấy mã đơn hàng");
        return;
    }

    try {
        const res = await fetch(`/api/order/detail/${orderId}/`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) throw new Error("Không thể lấy dữ liệu đơn hàng");

        const data = await res.json();

        document.getElementById('id-order').innerText = data.id;
        setKvText('date-order', new Date(data.created_at).toLocaleDateString('vi-VN'));
        setKvHtml('status-order', renderStatus(data.status));

        const price = parseFloat(data.total_price);
        setKvHtml('price-order', `<span class="fw-bold text-dark">${price.toLocaleString('vi-VN')} VNĐ</span>`);

        const orderTable = document.getElementById('order-table');
        orderTable.innerHTML = '';

        data.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${item.product.image}" class="product-img" alt=""></td>
                <td>${item.product.name}</td>
                <td>${parseFloat(item.price).toLocaleString('vi-VN')}đ</td>
                <td>${item.quantity}</td>
                <td>${(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
            `;
            orderTable.appendChild(tr);
        });

        if (data.shipping_address) {
            const addr = data.shipping_address;
            setKvText('username-order', addr.full_name || "");
            setKvText('address-order', addr.address || "");
            setKvText('city-order', addr.city || "");
            setKvText('phone-order', addr.phone || "");
        }

        const reviewTable = document.getElementById('product-name-order');
        reviewTable.innerHTML = '';

        if (canReview(data.status)) {
            data.items.forEach(item => {
                const tr = document.createElement('tr');

                tr.innerHTML = `
            <td>${item.product.name}</td>
            <td>
                <button class="btn-review"
                    onclick="reviewProduct(${item.product.id}, ${data.id})">
                    Đánh giá
                </button>
            </td>`;
                reviewTable.appendChild(tr);
            });
        } else {
            reviewTable.innerHTML = `
        <tr>
            <td colspan="2" class="text-center text-muted">
                Bạn chỉ có thể đánh giá sau khi đơn hàng đã được giao.
            </td>
        </tr>`;
        }

        const cancelBtn = document.getElementById('cancel-order-btn');
        if (!(data.status === 1 || data.status === 2)) {
            cancelBtn.style.display = 'none';
        } else {
            cancelBtn.onclick = () => cancelOrder(data.id);
        }

    } catch (err) {
        console.error("Lỗi tải chi tiết đơn hàng:", err);
    }
}

async function cancelOrder(orderId) {
    const token = localStorage.getItem("access_token");

    antd.Modal.confirm({
        title: 'Xác nhận hủy đơn',
        content: 'Bạn có chắc muốn hủy đơn này?',
        okText: 'Hủy đơn',
        okType: 'danger',
        cancelText: 'Không',

        async onOk() {
            try {
                const res = await fetch(`/api/order/detail/cancel/${orderId}/`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (res.ok) {
                    antd.notification.success({
                        message: 'Thành công',
                        description: 'Đơn hàng đã được hủy'
                    });

                    loadDetailOrder();

                } else {
                    antd.notification.error({
                        message: 'Lỗi',
                        description: data.error || "Không thể hủy đơn"
                    });
                }

            } catch (err) {
                console.error(err);
                antd.notification.error({
                    message: 'Lỗi hệ thống'
                });
            }
        }
    });
}
