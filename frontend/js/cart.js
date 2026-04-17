const CART_ENDPOINTS = {
    base: "/api/cart",
    clear: "/api/cart/clear",
    shipping: "/api/shippingAddress/user-addresses",
    ghn: "http://localhost:8080/api/GhnShipping/calculate-fee"
};

let listAddresses = [];
let selectedAddressId = null;
let addressModal;
let currentSubtotal = 0;
let currentWeight = 0;

function initCartEvents() {
    if (window.cartEventsInitialized) return;
    window.cartEventsInitialized = true;
    
    document.addEventListener("show.bs.offcanvas", (e) => {
        if (e.target.id === "miniCart") loadMiniCart();
    });

    document.addEventListener("click", (e) => {
        const removeMini = e.target.closest(".remove-item-btn");
        const removeFull = e.target.closest(".btn-remove-item");
        const minusBtn = e.target.closest(".btn-minus");
        const plusBtn = e.target.closest(".btn-plus");
        const removeAll = e.target.closest(".remove-all-item");
        const token = localStorage.getItem("access_token");

        if (!token) {
            if (removeFull) handleGuestAction('remove', removeFull.dataset.id);
            if (minusBtn) handleGuestAction('minus', minusBtn.dataset.id);
            if (plusBtn) handleGuestAction('plus', plusBtn.dataset.id);
            if (removeAll) handleGuestAction('clear');
        } else {
            if (removeMini) removeItemMiniCart(removeMini.dataset.id);
            if (removeFull) removeCartItem(removeFull.dataset.id);
            if (minusBtn) changeQty(minusBtn, minusBtn.dataset.id, -1);
            if (plusBtn) changeQty(plusBtn, plusBtn.dataset.id, 1);
            if (removeAll) clearAllCart();
        }
    });
}

function initCartState() {
    const modalEl = document.getElementById('addressModal');
    if (modalEl) {
        addressModal = new bootstrap.Modal(modalEl);
    }
    syncGuestCart().then(() => {
        updateCartBadge();
        loadCart();
        loadAddresses();
    });
}

window.runCartInit = function() {
    initCartState();
    initCartEvents();
};

if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", window.runCartInit);
} else {
    window.runCartInit();
}

function handleGuestAction(action, id) {
    let guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
    if (action === 'remove') {
        guestCart = guestCart.filter(item => item.id !== id && item.product.id != id);
    } else if (action === 'minus') {
        let item = guestCart.find(i => i.id === id || i.product.id == id);
        if (item && item.quantity > 1) item.quantity -= 1;
    } else if (action === 'plus') {
        let item = guestCart.find(i => i.id === id || i.product.id == id);
        if (item && item.quantity < (item.product.stock || 99)) item.quantity += 1;
    } else if (action === 'clear') {
        guestCart = [];
    }
    localStorage.setItem('guest_cart', JSON.stringify(guestCart));
    loadCart();
    loadMiniCart();
    updateCartBadge();
}

async function syncGuestCart() {
    const token = localStorage.getItem("access_token");
    let guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
    if (token && guestCart.length > 0) {
        for (let item of guestCart) {
            try {
                await fetch(CART_ENDPOINTS.base, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        product_id: item.product.id,
                        quantity: item.quantity
                    })
                });
            } catch (e) {}
        }
        localStorage.removeItem('guest_cart');
    }
}

async function updateCartBadge() {
    const badge = document.querySelector(".cart-badge");
    const token = localStorage.getItem("access_token");
    if (!badge) return;
    
    try {
        let count = 0;
        if (token) {
            const response = await fetch(CART_ENDPOINTS.base, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const items = await response.json();
                count = items.reduce((sum, i) => sum + i.quantity, 0);
            }
        } else {
            let guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
            count = guestCart.reduce((sum, i) => sum + i.quantity, 0);
        }
        badge.innerText = count;
        
        if (count > 0) {
            badge.style.display = "inline-flex";
            badge.style.alignItems = "center";
            badge.style.justifyContent = "center";
            badge.style.backgroundColor = "#89b500";
            badge.style.color = "white";
            badge.style.borderRadius = "50%";
            badge.style.width = "20px";
            badge.style.height = "20px";
            badge.style.fontSize = "11px";
            badge.style.position = "absolute";
            badge.style.top = "-5px";
            badge.style.right = "-10px";
        } else {
            badge.style.display = "none";
        }
    } catch {
        badge.style.display = "none";
    }
}

async function loadCart() {
    const template = document.getElementById("template-cart");
    const container = document.getElementById("cart-item");
    const cartTotals = document.querySelector('.row.g-5');
    const actionButtons = document.querySelector('.d-flex.flex-wrap.gap-2.mb-5');
    const token = localStorage.getItem("access_token");
    
    if (!container || !template) return;
    
    let data = [];
    try {
        if (token) {
            const response = await fetch(CART_ENDPOINTS.base, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) data = await response.json();
        } else {
            data = JSON.parse(localStorage.getItem('guest_cart')) || [];
        }

        if (!data || data.length === 0) {
            container.innerHTML = "<tr><td colspan='7' class='text-center py-5'>Giỏ hàng của bạn đang trống.</td></tr>";
            if (cartTotals) cartTotals.style.display = 'none';
            if (actionButtons) actionButtons.style.display = 'none';
            return;
        }
        
        if (cartTotals) cartTotals.style.display = 'flex';
        if (actionButtons) actionButtons.style.display = 'flex';
        container.innerHTML = '';
        
        let subtotal = 0;
        let totalWeight = 0;

        data.forEach(item => {
            const clone = template.content.cloneNode(true);
            const product = item.product;
            const price = parseFloat(product.price) || 0;
            const weightGram = parseFloat(product.weightgram) || parseFloat(product.weightGram) || parseFloat(product.WeightGram) || 0;
            const itemWeight = weightGram * parseInt(item.quantity);
            subtotal += price * item.quantity;
            totalWeight += itemWeight;
            
            const img = clone.querySelector(".cart-img");
            if (img) img.src = product.images?.[0]?.image ? (product.images[0].image.startsWith('http') ? product.images[0].image : (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '') + product.images[0].image) : "img/bag-filled.png";
            
            const nameEl = clone.querySelector(".cart-name");
            if (nameEl) nameEl.innerText = product.name;
            
            const priceEl = clone.querySelector(".cart-price");
            if (priceEl) priceEl.innerText = price.toLocaleString("vi-VN") + " đ";
            
            const qtyEl = clone.querySelector(".cart-qty");
            if (qtyEl) qtyEl.value = item.quantity;
            
            const weightEl = clone.querySelector(".cart-weight");
            if (weightEl) weightEl.innerText = itemWeight + "g";
            
            const totalItemEl = clone.querySelector(".total-price-item");
            if (totalItemEl) totalItemEl.innerText = (price * item.quantity).toLocaleString("vi-VN") + " đ";
            
            const btns = [".btn-remove-item", ".btn-minus", ".btn-plus"];
            btns.forEach(cls => {
                const b = clone.querySelector(cls);
                if (b) b.setAttribute("data-id", token ? item.id : (item.id || product.id));
            });
            
            container.appendChild(clone);
        });
        
        currentWeight = totalWeight + 300; 
        currentSubtotal = subtotal;

        const productWeightEl = document.getElementById('productWeight');
        if (productWeightEl) productWeightEl.innerText = totalWeight + " g";
        
        const totalWeightEl = document.getElementById('totalWeight');
        if (totalWeightEl) totalWeightEl.innerText = currentWeight + " g";
        
        const totalPriceEls = document.querySelectorAll(".total-price");
        totalPriceEls.forEach(el => {
            el.innerText = currentSubtotal.toLocaleString("vi-VN") + " đ";
        });
        
        if (token) calculateShipping(currentWeight, currentSubtotal);
    } catch (error) {
        container.innerHTML = "<tr><td colspan='7' class='text-danger text-center'>Lỗi tải dữ liệu.</td></tr>";
    }
}

async function loadMiniCart() {
    const container = document.getElementById("mini-cart-list");
    const token = localStorage.getItem("access_token");
    if (!container) return;

    let data = [];
    try {
        if (token) {
            const response = await fetch(CART_ENDPOINTS.base, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) data = await response.json();
        } else {
            data = JSON.parse(localStorage.getItem('guest_cart')) || [];
        }
    } catch (e) {}

    if (data.length === 0) {
        container.innerHTML = '<li class="text-center py-3">Giỏ hàng trống</li>';
        return;
    }

    container.innerHTML = "";
    data.forEach(item => {
        const product = item.product;
        const price = parseFloat(product.price) || 0;
        const img = product.images?.[0]?.image || 'img/bag-filled.png';
        
        const li = document.createElement("li");
        li.className = "d-flex align-items-center mb-3 p-2 border-bottom";
        li.innerHTML = `
            <img src="${img.startsWith('http') ? img : (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : '') + img}" style="width: 50px; height: 50px; object-fit: cover;" class="me-3">
            <div class="flex-grow-1">
                <h6 class="mb-0 small fw-bold">${product.name}</h6>
                <small class="text-muted">${item.quantity} x ${price.toLocaleString('vi-VN')} đ</small>
            </div>
            <button class="btn btn-sm text-danger remove-item-btn" data-id="${token ? item.id : (item.id || product.id)}">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(li);
    });
}

async function loadAddresses() {
    const token = localStorage.getItem("access_token");
    const display = document.getElementById('addressDisplay');
    
    if (!token) {
        // For guests: show login/register prompt
        if (display) {
            display.innerHTML = `
                <div class="alert alert-info p-3 mb-0">
                    <div class="d-flex align-items-start">
                        <i class="fas fa-info-circle me-3 mt-1 text-info" style="font-size: 1.2rem;"></i>
                        <div>
                            <strong>Vui lòng đăng nhập</strong>
                            <p class="mb-2 small mt-1">Để xem và quản lý địa chỉ giao hàng của bạn, vui lòng đăng nhập hoặc đăng ký tài khoản.</p>
                            <div class="d-flex gap-2">
                                <a href="login.html" class="btn btn-sm btn-primary">Đăng nhập</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        return;
    }

    // For authenticated users: load from API
    try {
        const response = await fetch(CART_ENDPOINTS.shipping, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error();
        listAddresses = await response.json();
        
        if (!listAddresses || listAddresses.length === 0) {
            if (display) {
                display.innerHTML = `
                    <div class="alert alert-warning p-3 mb-0">
                        <div class="d-flex align-items-start">
                            <i class="fas fa-exclamation-triangle me-3 mt-1"></i>
                            <div>
                                <strong>Bạn chưa có địa chỉ giao hàng</strong>
                                <p class="mb-2 small mt-1">Vui lòng thêm địa chỉ giao hàng trước khi thanh toán.</p>
                                <a href="account.html?tab=address" class="btn btn-sm btn-warning">Thêm địa chỉ</a>
                            </div>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        const activeAddr = listAddresses.find(a => a.default) || listAddresses[0];
        if (activeAddr) {
            selectedAddressId = activeAddr.id;
            renderAddress(activeAddr);
            calculateShipping(); 
        }
        renderAddressListModal(listAddresses);
    } catch (e) {
        if (display) display.innerHTML = '<div class="text-danger small">Lỗi tải địa chỉ.</div>';
    }
}

function renderAddress(addr) {
    const display = document.getElementById('addressDisplay');
    if (display) {
        display.innerHTML = `
            <div class="fw-bold">${addr.fullName} | ${addr.phone}</div>
            <div class="small text-secondary">${addr.address}</div>
            <div class="small text-muted">${addr.city}</div>`;
    }
}

function renderAddressListModal(addresses) {
    const container = document.getElementById("modalAddressList");
    if (!container) return;
    if (addresses.length === 0) {
        container.innerHTML = '<div class="text-center p-3 text-muted">Trống</div>';
        return;
    }
    container.innerHTML = addresses.map(addr => `
        <button type="button" 
                class="list-group-item list-group-item-action p-3 ${addr.id === selectedAddressId ? 'active' : ''}"
                onclick="selectAddress(${addr.id})">
            <div class="d-flex justify-content-between align-items-center">
                <div class="fw-bold">${addr.fullName} ${addr.default ? '<span class="badge bg-success ms-2">Mặc định</span>' : ''}</div>
                <div class="small">${addr.phone}</div>
            </div>
            <div class="small mt-1">${addr.address}</div>
        </button>
    `).join('');
}

function selectAddress(id) {
    const addr = listAddresses.find(a => a.id === id);
    if (addr) {
        selectedAddressId = id;
        renderAddress(addr); 
        const modalEl = document.getElementById('addressModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
        calculateShipping();
        renderAddressListModal(listAddresses);
    }
}

async function calculateShipping(weight = currentWeight, subtotal = currentSubtotal) {
    if (!selectedAddressId) return;
    const addr = listAddresses.find(a => a.id === selectedAddressId);
    if (!addr) return;
    try {
        const response = await fetch(CART_ENDPOINTS.ghn, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromDistrictId: 1451,
                toDistrictId: parseInt(addr.districtId),
                toWardCode: String(addr.wardCode),
                weight: weight || 300,
                insuranceValue: 0
            })
        });
        const result = await response.json();
        const fee = result.total || result.data?.total || 0;
        updateSummaryUI(subtotal, fee);
    } catch (e) {
        updateSummaryUI(subtotal, 0);
    }
}

function updateSummaryUI(subtotal, fee) {
    const feeEl = document.getElementById('shippingFee');
    const totals = document.querySelectorAll(".total-price");
    if (feeEl) feeEl.innerText = fee.toLocaleString('vi-VN') + " đ";
    if (totals[0]) totals[0].innerText = subtotal.toLocaleString('vi-VN') + " đ";
    if (totals[1]) totals[1].innerText = (subtotal + fee).toLocaleString('vi-VN') + " đ";
}

window.openAddressModal = function() {
    if (addressModal) addressModal.show();
};

async function removeItemMiniCart(id) { await removeCartItem(id); }

async function removeCartItem(id) {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
        await fetch(`${CART_ENDPOINTS.base}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadCart();
        loadMiniCart();
        updateCartBadge();
    } catch(e) {}
}

async function changeQty(btn, id, delta) {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
        const row = btn.closest('tr');
        const qtyInput = row ? row.querySelector('.cart-qty') : null;
        let currentQty = qtyInput ? parseInt(qtyInput.value) : 0;
        let newQty = currentQty + delta;
        if (newQty < 1) newQty = 1;
        if (qtyInput) qtyInput.value = newQty;
        
        await fetch(`${CART_ENDPOINTS.base}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ quantity: newQty })
        });
        loadCart();
        loadMiniCart();
        updateCartBadge();
    } catch(e) {}
}

async function clearAllCart() {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
        await fetch(CART_ENDPOINTS.clear, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadCart();
        loadMiniCart();
        updateCartBadge();
    } catch(e) {}
}