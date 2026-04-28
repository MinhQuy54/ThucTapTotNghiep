document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("access_token");

    if (document.getElementById("btn-place-order")) {
        await loadCartCheckout();
        await loadAddressCheckout();

        document.getElementById("btn-place-order").addEventListener("click", placeOrder);
        const addressSelect = document.getElementById("address");
        if (addressSelect) {
            addressSelect.addEventListener("change", onAddressChange);
        }

        const btnApplyVoucher = document.getElementById("btn-apply-voucher");
        if (btnApplyVoucher) {
            btnApplyVoucher.addEventListener("click", applyVoucher);
        }

        const btnToggle = document.getElementById("btn-toggle-vouchers");
        if (btnToggle) {
            btnToggle.addEventListener("click", async () => {
                const panel = document.getElementById("voucher-list-checkout");
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                    btnToggle.innerHTML = '<i class="fa-solid fa-chevron-up me-1"></i>Ẩn';
                    await loadVouchersForCheckout();
                } else {
                    panel.style.display = 'none';
                    btnToggle.innerHTML = '<i class="fa-solid fa-ticket me-1"></i>Chọn voucher';
                }
            });
        }
    }
});

let checkoutAddressList = [];
let checkoutCartData = [];
let appliedVoucher = null; // { code, discount }

async function loadAddressCheckout() {
    const token = localStorage.getItem("access_token");
    const addressSelect = document.getElementById("address");
    const addressSection = document.querySelector('.checkout-section');
    const inputFields = document.querySelectorAll('#fullname, #phone, #address-detail, #city');
    const placeOrderBtn = document.getElementById("btn-place-order");

    if (!token) {
        // For guests: show login/register prompt and hide address inputs
        if (addressSelect) {
            addressSelect.style.display = 'none';
        }
        
        // Hide all input fields
        inputFields.forEach(field => {
            field.style.display = 'none';
        });
        
        // Hide place order button
        if (placeOrderBtn) {
            placeOrderBtn.style.display = 'none';
        }
        
        if (addressSection) {
            const guestMsg = addressSection.querySelector('.guest-login-msg');
            if (!guestMsg) {
                const msgEl = document.createElement('div');
                msgEl.className = 'alert alert-info p-3 mb-0 guest-login-msg';
                msgEl.innerHTML = `
                    <div class="d-flex align-items-start">
                        <i class="fas fa-lock me-3 mt-1" style="font-size: 1.2rem;"></i>
                        <div>
                            <strong>Vui lòng đăng nhập để thanh toán</strong>
                            <p class="mb-2 small mt-1">Bạn cần đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng.</p>
                            <div class="d-flex gap-2">
                                <a href="login.html?redirect=checkout.html" class="btn btn-sm btn-primary">Đăng nhập</a>
                                <a href="register.html" class="btn btn-sm btn-outline-primary">Đăng ký</a>
                            </div>
                        </div>
                    </div>
                `;
                addressSection.appendChild(msgEl);
            }
        }
        return;
    }

    // For authenticated users: show address inputs and button
    inputFields.forEach(field => {
        field.style.display = 'block';
    });
    
    if (placeOrderBtn) {
        placeOrderBtn.style.display = 'inline-block';
    }

    // For authenticated users: load from API
    try {
        const response = await fetchWithAuth('/api/shippingAddress/user-addresses');
        if (!response.ok) return;

        checkoutAddressList = await response.json();
        addressSelect.innerHTML = '<option value="">-- Chọn địa chỉ giao hàng --</option>';
        addressSelect.style.display = 'block';

        checkoutAddressList.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = `${item.fullName} - ${item.address}`;
            addressSelect.appendChild(option);
        });

        const defaultAddr = checkoutAddressList.find(a => a.default === true) || checkoutAddressList[0];
        if (defaultAddr) {
            addressSelect.value = defaultAddr.id;
            fillAddressForm(defaultAddr);
            calculateShippingCheckout(defaultAddr);
        }
    } catch (error) { 
        console.error("Load address error:", error); 
    }
}

function onAddressChange() {
    const selected = checkoutAddressList.find(a => a.id == this.value);
    if (selected) {
        fillAddressForm(selected);
        calculateShippingCheckout(selected);
    }
}

function fillAddressForm(addr) {
    document.getElementById("fullname").value = addr.fullName || "";
    document.getElementById("phone").value = addr.phone || "";
    document.getElementById("address-detail").value = addr.address || "";
    document.getElementById("city").value = addr.city || "";
}

async function calculateShippingCheckout(addr) {
    const feeDisplay = document.getElementById('shippingFee');
    
    const subTotalText = document.getElementById("subTotal").innerText;
    const subTotal = parseFloat(subTotalText.replace(/[^0-9]/g, "")) || 0;

    let totalWeight = 300; 
    checkoutCartData.forEach(item => {
        const weight = item.product.weightgram || item.product.weightGram || item.product.WeightGram || item.product.weight_gram || 0;
        totalWeight += (weight * item.quantity);
    });

    feeDisplay.innerText = "Đang tính...";

    try {
        const response = await fetch('/api/GhnShipping/calculate-fee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromDistrictId: 1451,
                // Lấy an toàn dữ liệu, nếu không có sẽ tự xử lý
                toDistrictId: parseInt(addr.districtId) || null,
                toWardCode: String(addr.wardCode || ""),
                weight: totalWeight,
                insuranceValue: 0
            })
        });

        const res = await response.json();
        
        if (response.ok) {
            const fee = res.total || res.data?.total || 0; 
            feeDisplay.innerText = fee.toLocaleString('vi-VN') + " đ";
            updateFinalTotalCheckout(subTotal, fee);
        } else {
            feeDisplay.innerText = "Lỗi tính phí";
            updateFinalTotalCheckout(subTotal, 0);
        }
        
    } catch (err) { 
        feeDisplay.innerText = "Không tính được phí"; 
        updateFinalTotalCheckout(subTotal, 0);
    }
}

async function loadCartCheckout() {
    const template = document.getElementById("template-checkout");
    const container = document.getElementById("summary-checkout");
    const token = localStorage.getItem("access_token");
    
    try {
        let response;
        if (token) {
            response = await fetchWithAuth('/api/cart/');
            if (!response.ok) return;
            checkoutCartData = await response.json();
        } else {
            // For guests: load from localStorage
            checkoutCartData = JSON.parse(localStorage.getItem('guest_cart')) || [];
        }

        if (!checkoutCartData || checkoutCartData.length === 0) {
            alert("Giỏ hàng của bạn đang rỗng. Vui lòng chọn sản phẩm trước khi thanh toán!");
            window.location.href = "cart.html"; 
            return;
        }

        container.innerHTML = '';
        let subTotal = 0;

        checkoutCartData.forEach(item => {
            const clone = template.content.cloneNode(true);
            const p = item.product;
            const price = parseFloat(p.price) || 0;
            const itemTotal = price * item.quantity;

            clone.querySelector('.name-checkout').innerText = p.name;
            clone.querySelector('.quantity-checkout').innerText = `x${item.quantity}`;
            clone.querySelector('.total-price-item-checkout').innerText = itemTotal.toLocaleString('vi-VN') + " đ";
            
            subTotal += itemTotal;
            container.appendChild(clone);
        });

        document.getElementById("subTotal").innerText = subTotal.toLocaleString('vi-VN') + " đ";
        updateFinalTotalCheckout(subTotal, 0); 
    } catch (error) { console.error(error); }
}

async function calculateShippingCheckout(addr) {
    const feeDisplay = document.getElementById('shippingFee');
    
    const subTotalText = document.getElementById("subTotal").innerText;
    const subTotal = parseFloat(subTotalText.replace(/[^0-9]/g, "")) || 0;

    if (!addr.districtId || !addr.wardCode) {
        feeDisplay.innerText = "Chưa rõ phí ship";
        updateFinalTotalCheckout(subTotal, 0);
        return;
    }

    let totalWeight = 300; 
    checkoutCartData.forEach(item => {
        const weight = item.product.weightgram || item.product.weightGram || item.product.WeightGram || item.product.weight_gram || 0;
        totalWeight += (weight * item.quantity);
    });

    feeDisplay.innerText = "Đang tính...";

    try {
        const response = await fetch('/api/GhnShipping/calculate-fee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromDistrictId: 1451,
                toDistrictId: parseInt(addr.districtId),
                toWardCode: String(addr.wardCode),
                weight: totalWeight,
                insuranceValue: 0
            })
        });

        const res = await response.json();
        
        if (response.ok) {
            const fee = res.total || res.data?.total || 0; 
            feeDisplay.innerText = fee.toLocaleString('vi-VN') + " đ";
            updateFinalTotalCheckout(subTotal, fee);
        } else {
            feeDisplay.innerText = "Lỗi tính phí";
            updateFinalTotalCheckout(subTotal, 0);
        }
        
    } catch (err) { 
        feeDisplay.innerText = "Không tính được phí"; 
        updateFinalTotalCheckout(subTotal, 0);
    }
}   

function updateFinalTotalCheckout(sub, ship) {
    const discount = appliedVoucher ? appliedVoucher.discount : 0;
    const total = Math.max(0, sub + ship - discount);
    document.getElementById("orderTotal").innerText = total.toLocaleString('vi-VN') + " đ";
}

async function loadVouchersForCheckout() {
    const loading = document.getElementById('voucher-cards-loading');
    const container = document.getElementById('voucher-cards-container');
    const token = localStorage.getItem('access_token');

    if (!token) {
        container.innerHTML = '<p class="small text-muted">Đăng nhập để xem voucher.</p>';
        loading.style.display = 'none';
        return;
    }

    loading.style.display = 'block';
    container.innerHTML = '';

    try {
        const res = await fetchWithAuth('/api/userVoucher/GetUserVouchers');
        if (!res.ok) throw new Error();
        const resData = await res.json();
        const vouchers = Array.isArray(resData) ? resData : (resData.data || []);
        loading.style.display = 'none';

        if (vouchers.length === 0) {
            container.innerHTML = '<p class="small text-muted text-center py-2">Bạn không có voucher nào.</p>';
            return;
        }

        // Nhóm trùng mã
        const grouped = {};
        vouchers.forEach(v => {
            const code = v.code || v.Code;
            if (!grouped[code]) grouped[code] = { ...v, count: 1 };
            else grouped[code].count++;
        });

        const subTotalText = document.getElementById('subTotal')?.innerText || '0';
        const subTotal = parseFloat(subTotalText.replace(/[^0-9]/g, '')) || 0;

        Object.values(grouped).forEach(v => {
            const code = v.code || v.Code;
            const type = v.discountType || v.DiscountType;
            const val = parseFloat(v.discountValue || v.DiscountValue || 0);
            const maxDisc = parseFloat(v.maxDiscount || v.MaxDiscount || 0);
            const minOrder = parseFloat(v.minOrderValue || v.MinOrderValue || 0);
            const endDate = new Date(v.endDate || v.EndDate).toLocaleDateString('vi-VN');
            const count = v.count;

            const eligible = subTotal >= minOrder;
            const isPercent = (type === 'percentage' || type === 'percent');
            const promoText = isPercent
                ? `Giảm ${val}%${maxDisc > 0 ? ` (tối đa ${maxDisc.toLocaleString('vi-VN')}đ)` : ''}`
                : `Giảm ${val.toLocaleString('vi-VN')}đ`;
            const badge = count > 1 ? `<span class="badge bg-danger ms-1" style="font-size:0.7rem">x${count}</span>` : '';
            const minText = minOrder > 0 ? `<span class="text-muted">Đơn từ ${minOrder.toLocaleString('vi-VN')}đ</span> · ` : '';
            const disabledClass = eligible ? '' : ' disabled';
            const isSelected = appliedVoucher?.code === code;

            const card = document.createElement('div');
            card.className = `voucher-card${disabledClass}${isSelected ? ' selected' : ''}`;
            card.dataset.code = code;
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <span class="fw-bold text-success">${code} ${badge}</span>
                </div>
                <div class="mt-1">${promoText}</div>
                <div class="mt-1 small">${minText}<span class="text-muted">HSD: ${endDate}</span></div>
                ${!eligible ? `<div class="mt-1 small text-danger">Cần mua thêm ${(minOrder - subTotal).toLocaleString('vi-VN')}đ</div>` : ''}
            `;

            if (eligible) {
                card.addEventListener('click', () => {
                    // Bỏ chọn nếu click lại
                    if (appliedVoucher?.code === code) {
                        appliedVoucher = null;
                        document.getElementById('voucher-input').value = '';
                        document.getElementById('discount-row').style.setProperty('display', 'none', 'important');
                        document.getElementById('voucher-feedback').innerHTML = '';
                        card.classList.remove('selected');
                        const subT = parseFloat(document.getElementById('subTotal').innerText.replace(/[^0-9]/g, '')) || 0;
                        const shipT = parseFloat(document.getElementById('shippingFee').innerText.replace(/[^0-9]/g, '')) || 0;
                        updateFinalTotalCheckout(subT, shipT);
                    } else {
                        document.querySelectorAll('.voucher-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                        document.getElementById('voucher-input').value = code;
                        applyVoucher();
                    }
                });
            }

            container.appendChild(card);
        });
    } catch (e) {
        loading.style.display = 'none';
        container.innerHTML = '<p class="small text-danger">Lỗi tải voucher.</p>';
    }
}

async function applyVoucher() {
    const token = localStorage.getItem("access_token");
    const code = (document.getElementById("voucher-input")?.value || "").trim().toUpperCase();
    const feedback = document.getElementById("voucher-feedback");
    const discountRow = document.getElementById("discount-row");
    const discountAmountEl = document.getElementById("discountAmount");

    if (!code) {
        feedback.innerHTML = `<span class="text-danger">Vui lòng nhập mã voucher.</span>`;
        return;
    }
    if (!token) {
        feedback.innerHTML = `<span class="text-danger">Vui lòng đăng nhập để sử dụng voucher.</span>`;
        return;
    }

    feedback.innerHTML = `<span class="text-muted">Đang kiểm tra...</span>`;

    try {
        const res = await fetchWithAuth('/api/userVoucher/GetUserVouchers');
        if (!res.ok) throw new Error();
        const resData = await res.json();
        const vouchers = Array.isArray(resData) ? resData : (resData.data || []);

        const voucher = vouchers.find(v => (v.code || v.Code || '').toUpperCase() === code);
        if (!voucher) {
            appliedVoucher = null;
            discountRow.style.setProperty('display', 'none', 'important');
            feedback.innerHTML = `<span class="text-danger">Mã voucher không hợp lệ hoặc không thuộc về bạn.</span>`;
            return;
        }

        // Tính discount
        const subTotalText = document.getElementById("subTotal").innerText;
        const subTotal = parseFloat(subTotalText.replace(/[^0-9]/g, "")) || 0;
        const minOrder = voucher.minOrderValue || voucher.MinOrderValue || 0;
        if (subTotal < minOrder) {
            appliedVoucher = null;
            discountRow.style.setProperty('display', 'none', 'important');
            feedback.innerHTML = `<span class="text-danger">Đơn hàng phải tối thiểu ${parseFloat(minOrder).toLocaleString('vi-VN')}đ.</span>`;
            return;
        }

        const type = voucher.discountType || voucher.DiscountType;
        const val = parseFloat(voucher.discountValue || voucher.DiscountValue || 0);
        const maxDisc = parseFloat(voucher.maxDiscount || voucher.MaxDiscount || 0);
        let discount = 0;
        const isPercent = (type === 'percentage' || type === 'percent');
        if (isPercent) {
            discount = subTotal * val / 100;
            if (maxDisc > 0 && discount > maxDisc) discount = maxDisc;
        } else {
            discount = val;
        }

        appliedVoucher = { code: code, discount: discount };
        discountRow.style.removeProperty('display');
        discountAmountEl.innerText = `-${discount.toLocaleString('vi-VN')} đ`;
        feedback.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-circle-check me-1"></i>Áp dụng thành công! Giảm ${discount.toLocaleString('vi-VN')}đ</span>`;

        // Cập nhật lại tổng tiền
        const shippingText = document.getElementById("shippingFee").innerText;
        const shipping = parseFloat(shippingText.replace(/[^0-9]/g, "")) || 0;
        updateFinalTotalCheckout(subTotal, shipping);

    } catch (e) {
        feedback.innerHTML = `<span class="text-danger">Có lỗi khi kiểm tra voucher.</span>`;
    }
}

async function placeOrder() {
    const token = localStorage.getItem("access_token");
    const btn = document.getElementById("btn-place-order");
    btn.disabled = true;
    btn.innerText = "Đang xử lý...";

    try {
        let payload;
        
        if (token) {
            // For authenticated users: use addressId
            const addressId = document.getElementById("address").value;
            if (!addressId) {
                alert("Vui lòng chọn địa chỉ giao hàng!");
                throw new Error("No address selected");
            }
            
            const shippingFeeText = document.getElementById("shippingFee").innerText;
            const shippingFee = parseFloat(shippingFeeText.replace(/[^0-9]/g, "")) || 0;
            const paymentMethod = document.getElementById("cod").checked ? "COD" : "MOMO";

            payload = {
                AddressId: parseInt(addressId),
                ShippingFee: shippingFee,
                PaymentMethod: paymentMethod,
                VoucherCode: appliedVoucher ? appliedVoucher.code : null
            };
            
            console.log("📦 Payload gửi:", payload);
            
            const response = await fetchWithAuth('/api/checkout/create-order', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            console.log("📡 Response status:", response.status);
            
            const textRes = await response.text();
            console.log("📝 Response text:", textRes);
            
            let data = {};
            try {
                data = textRes ? JSON.parse(textRes) : {};
            } catch (e) {
                console.log("Response không phải JSON:", textRes);
            }

            if (response.ok) {
                if (paymentMethod === "MOMO" && data.payUrl) {
                    window.location.href = data.payUrl;
                } else {
                    window.location.href = `success.html?orderId=${data.orderId || ''}`;
                }
            } else {
                alert("Lỗi: " + (data.message || textRes || "Checkout thất bại"));
            }
        } else {
            // This should never happen as guests are redirected at DOMContentLoaded
            alert("Vui lòng đăng nhập để thanh toán!");
            window.location.href = "login.html?redirect=checkout.html";
            return;
        }
    } catch (error) {
        console.error("Checkout error:", error);
        alert("Lỗi thực thi. Vui lòng thử lại.");
    } finally {
        btn.disabled = false;
        btn.innerText = "ĐẶT HÀNG NGAY";
    }
}