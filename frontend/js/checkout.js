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
    }
});

let checkoutAddressList = [];
let checkoutCartData = [];

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
    document.getElementById("orderTotal").innerText = (sub + ship).toLocaleString('vi-VN') + " đ";
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
                PaymentMethod: paymentMethod
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