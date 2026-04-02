let editingAddressId = null;
const ghnLocationCache = {
    provinces: [],
    districts: new Map(),
    wards: new Map()
};

document.addEventListener("DOMContentLoaded", () => {
    initAddressForm();
    loadUserProfile();
    updateAccount();
    updatePassword();
    loadAddress();
    loadOrder();
});

function renderStatus(status) {
    switch (status) {
        case 1:
            return '<span class="badge bg-warning text-dark">Chờ xác nhận</span>';
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

async function fetchGHNData(endpoint, method = "GET", body = null) {
    const token = localStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        throw new Error("Thiếu access token");
    }

    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`/api/${endpoint}`, options);
    const data = await res.json();

    if (!res.ok || (data.code && String(data.code) !== "200")) {
        throw new Error(data.message || "Không tải được dữ liệu địa chỉ");
    }

    return data;
}

function getAddressElements() {
    return {
        provinceSelect: document.getElementById('addr-province'),
        districtSelect: document.getElementById('addr-district'),
        wardSelect: document.getElementById('addr-ward'),
        saveAddressBtn: document.getElementById('save-address-btn')
    };
}

function renderSelectOptions(select, items, valueKey, labelKey, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>` +
        items.map(item => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join('');
}

function resetDistrictSelect() {
    const { districtSelect } = getAddressElements();
    districtSelect.disabled = true;
    renderSelectOptions(districtSelect, [], "DistrictID", "DistrictName", "Chọn quận / huyện");
    resetWardSelect();
}

function resetWardSelect() {
    const { wardSelect } = getAddressElements();
    wardSelect.disabled = true;
    renderSelectOptions(wardSelect, [], "WardCode", "WardName", "Chọn phường / xã");
}

async function loadGHNProvinces(selectedProvinceId = "") {
    const provinceSelect = document.getElementById('addr-province');

    if (ghnLocationCache.provinces.length === 0) {
        const result = await fetchGHNData("ghn/provinces/");
        ghnLocationCache.provinces = Array.isArray(result.data) ? result.data : [];
    }

    renderSelectOptions(
        provinceSelect,
        ghnLocationCache.provinces,
        "ProvinceID",
        "ProvinceName",
        "Chọn tỉnh / thành phố"
    );

    if (selectedProvinceId) {
        provinceSelect.value = String(selectedProvinceId);
    }
}

async function loadGHNDistricts(provinceId, selectedDistrictId = "") {
    const { districtSelect } = getAddressElements();

    if (!provinceId) {
        resetDistrictSelect();
        return;
    }

    const cacheKey = String(provinceId);
    if (!ghnLocationCache.districts.has(cacheKey)) {
        const result = await fetchGHNData("ghn/districts/", "POST", { province_id: Number(provinceId) });
        ghnLocationCache.districts.set(cacheKey, Array.isArray(result.data) ? result.data : []);
    }

    districtSelect.disabled = false;
    renderSelectOptions(
        districtSelect,
        ghnLocationCache.districts.get(cacheKey) || [],
        "DistrictID",
        "DistrictName",
        "Chọn quận / huyện"
    );

    if (selectedDistrictId) {
        districtSelect.value = String(selectedDistrictId);
    }
}

async function loadGHNWards(districtId, selectedWardCode = "") {
    const { wardSelect } = getAddressElements();

    if (!districtId) {
        resetWardSelect();
        return;
    }

    const cacheKey = String(districtId);
    if (!ghnLocationCache.wards.has(cacheKey)) {
        const result = await fetchGHNData("ghn/wards/", "POST", { district_id: Number(districtId) });
        ghnLocationCache.wards.set(cacheKey, Array.isArray(result.data) ? result.data : []);
    }

    wardSelect.disabled = false;
    renderSelectOptions(
        wardSelect,
        ghnLocationCache.wards.get(cacheKey) || [],
        "WardCode",
        "WardName",
        "Chọn phường / xã"
    );

    if (selectedWardCode) {
        wardSelect.value = String(selectedWardCode);
    }
}

function getSelectedProvince() {
    const { provinceSelect } = getAddressElements();
    return ghnLocationCache.provinces.find(
        province => String(province.ProvinceID) === String(provinceSelect.value)
    ) || null;
}

function getSelectedDistrict() {
    const { provinceSelect, districtSelect } = getAddressElements();
    const districts = ghnLocationCache.districts.get(String(provinceSelect.value)) || [];
    return districts.find(
        district => String(district.DistrictID) === String(districtSelect.value)
    ) || null;
}

function getSelectedWard() {
    const { districtSelect, wardSelect } = getAddressElements();
    const wards = ghnLocationCache.wards.get(String(districtSelect.value)) || [];
    return wards.find(
        ward => String(ward.WardCode) === String(wardSelect.value)
    ) || null;
}

function buildLocationText() {
    const selectedProvince = getSelectedProvince();
    const selectedDistrict = getSelectedDistrict();
    const selectedWard = getSelectedWard();

    return [selectedWard?.WardName, selectedDistrict?.DistrictName, selectedProvince?.ProvinceName]
        .filter(Boolean)
        .join(", ");
}

function resetAddressForm() {
    document.getElementById('addr-name').value = "";
    document.getElementById('addr-phone').value = "";
    document.getElementById('addr-detail').value = "";
    document.getElementById('addr-default').checked = false;
    document.getElementById('addr-province').value = "";
    resetDistrictSelect();
}

function initAddressForm() {
    const { provinceSelect, districtSelect, saveAddressBtn } = getAddressElements();

    if (!provinceSelect || !districtSelect || !saveAddressBtn) {
        return;
    }

    provinceSelect.addEventListener('change', async (e) => {
        try {
            resetDistrictSelect();
            await loadGHNDistricts(e.target.value);
        } catch (error) {
            console.error(error);
            antd.notification.error({
                message: 'Lỗi',
                description: error.message
            });
        }
    });

    districtSelect.addEventListener('change', async (e) => {
        try {
            resetWardSelect();
            await loadGHNWards(e.target.value);
        } catch (error) {
            console.error(error);
            antd.notification.error({
                message: 'Lỗi',
                description: error.message
            });
        }
    });

    saveAddressBtn.addEventListener("click", addAddress);

    loadGHNProvinces().catch(error => {
        console.error(error);
    });
}

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


function updatePassword() {
    const token = localStorage.getItem("access_token");
    const updateForm = document.getElementById('change-password-form');

    if (!token || !updateForm) return;

    updateForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const updateData = {
            current_password: document.getElementById('current-password').value,
            new_password: document.getElementById('new-password').value,
            confirm_password: document.getElementById('confirm-password').value
        };

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
        return;
    }

    try {
        const res = await fetch('/api/address/', {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error("Không thể tải địa chỉ giao hàng");
        }

        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            addressTable.innerHTML = `
                <tr>
                    <td colspan="6" class="py-4 text-muted">Bạn chưa có địa chỉ giao hàng nào.</td>
                </tr>
            `;
            return;
        }

        data.forEach(addr => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${addr.full_name}</td>
                <td>${addr.address || ""}</td>
                <td>${addr.city || ""}</td>
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
        });
    } catch (error) {
        console.error(error);
        antd.notification.error({
            message: 'Lỗi',
            description: error.message,
            placement: 'topRight',
            duration: 4
        });
    }
}

async function openAddModal() {
    editingAddressId = null;
    resetAddressForm();
    try {
        await loadGHNProvinces();
    } catch (error) {
        console.error(error);
    }
}

async function addAddress() {
    const selectedProvince = getSelectedProvince();
    const selectedDistrict = getSelectedDistrict();
    const selectedWard = getSelectedWard();

    const payload = {
        full_name: document.getElementById('addr-name').value.trim(),
        phone: document.getElementById('addr-phone').value.trim(),
        address: document.getElementById('addr-detail').value.trim(),
        city: buildLocationText(),
        province_id: selectedProvince ? selectedProvince.ProvinceID : null,
        district_id: selectedDistrict ? selectedDistrict.DistrictID : null,
        ward_code: selectedWard ? selectedWard.WardCode : null,
        default: document.getElementById('addr-default').checked
    };

    if (!payload.full_name || !payload.phone || !payload.address) {
        antd.notification.warning({
            message: 'Thiếu thông tin',
            description: 'Vui lòng nhập đầy đủ thông tin'
        });
        return;
    }

    if (!payload.province_id || !payload.district_id || !payload.ward_code) {
        antd.notification.warning({
            message: 'Thiếu khu vực',
            description: 'Vui lòng chọn đầy đủ tỉnh/thành phố, quận/huyện và phường/xã.'
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
            resetAddressForm();

            loadAddress();

        } else {
            antd.notification.error({
                message: 'Lỗi',
                description: data.error || JSON.stringify(data)
            });
        }

    } catch (err) {
        console.error(err);
        antd.notification.error({
            message: 'Lỗi hệ thống',
            description: 'Không thể lưu địa chỉ giao hàng'
        });
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

        if (!res.ok) {
            throw new Error("Không thể lấy thông tin địa chỉ");
        }

        const addr = await res.json();

        resetAddressForm();
        await loadGHNProvinces(addr.province_id);

        document.getElementById('addr-name').value = addr.full_name;
        document.getElementById('addr-phone').value = addr.phone;
        document.getElementById('addr-detail').value = addr.address;
        document.getElementById('addr-default').checked = addr.default;

        if (addr.province_id) {
            await loadGHNDistricts(addr.province_id, addr.district_id);
        }

        if (addr.district_id) {
            await loadGHNWards(addr.district_id, addr.ward_code);
        }

        // mở modal
        const modalEl = document.getElementById('addressModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

    } catch (error) {
        console.error(error);
        antd.notification.error({
            message: 'Lỗi',
            description: error.message
        });
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
        orderTable.innerHTML =
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
