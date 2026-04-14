
document.addEventListener("show.bs.offcanvas", function (event) {
    if (event.target.id === "miniCart") {
        loadMiniCart();
    }
});
document.addEventListener("click", function (e) {

    const removeBtn = e.target.closest(".remove-item-btn");
    if (!removeBtn) return;

    const id = removeBtn.getAttribute("data-id");
    removeItemMiniCart(id);

});

document.addEventListener("click", function (e) {

    const removeBtn = e.target.closest(".btn-remove-item");
    if (!removeBtn) return;

    const id = removeBtn.getAttribute("data-id");
    removeCartItem(id);

});

document.addEventListener("click", function (e) {

    const minusBtn = e.target.closest(".btn-minus");
    const plusBtn = e.target.closest(".btn-plus");

    if (minusBtn) {
        const cartId = minusBtn.getAttribute("data-id");
        changeQty(minusBtn, cartId, -1);
    }

    if (plusBtn) {
        const cartId = plusBtn.getAttribute("data-id");
        changeQty(plusBtn, cartId, 1);
    }
});

document.querySelector(".remove-all-item")?.addEventListener("click", async () => {
    const isConfirmed = confirm("Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng không? Hành động này không thể hoàn tác.");

    if (!isConfirmed) return; 

    try {
        const response = await fetchWithAuth("/api/cart/clear", {
            method: "DELETE"
        });

        if (response.ok) {
            alert("Giỏ hàng đã được làm trống!");
            
            if (typeof loadCart === "function") await loadCart();
            if (typeof loadMiniCart === "function") await loadMiniCart();
            if (typeof updateCartBadge === "function") await updateCartBadge();
        } else {
            const errorData = await response.json();
            alert("Lỗi: " + (errorData.message || "Không thể xóa giỏ hàng."));
        }
    } catch (error) {
        console.error("Lỗi khi xóa toàn bộ giỏ hàng:", error);
        alert("Đã xảy ra lỗi kết nối máy chủ.");
    }
});

document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    loadCart();

});

document.addEventListener("DOMContentLoaded", function () {
    loadUserAddresses();
});


async function updateCartBadge() {

    const badge = document.querySelector(".cart-badge");
    const token = localStorage.getItem("access_token");


    if (!badge) {
        setTimeout(updateCartBadge, 200);
        return;
    }

    if (!token) {
        badge.innerText = 0;
        return;
    }

    try {

        const response = await fetchWithAuth(`/api/cart`)

        if (!response.ok) {
            badge.innerText = 0;
            return;
        }

        const cartItems = await response.json();

        let totalQuantity = 0;

        cartItems.forEach(item => {
            totalQuantity += item.quantity;
        });

        badge.innerText = totalQuantity;

    } catch (error) {
        console.error(error);
        badge.innerText = 0;
    }
}

async function loadMiniCart() {

    const miniCartContainer = document.getElementById("mini-cart-list");
    const template = document.getElementById("mini-cart-template");
    const subtotalEl = document.getElementById("mini-cart-subtotal");

    const token = localStorage.getItem("access_token");

    if (!token) return;

    try {

        const response = await fetchWithAuth(`/api/cart`);

        if (!response.ok) {
            throw new Error("Không tìm thấy giỏ hàng");
        }

        const cartItems = await response.json();

        miniCartContainer.innerHTML = "";
        let subtotal = 0;

        if (cartItems.length === 0) {
            miniCartContainer.innerHTML = "<p class='text-center fw-bold'>Giỏ hàng trống</p>";
            subtotalEl.innerText = "0đ";
            return;
        }
        cartItems.forEach(cart => {

            const clone = template.content.cloneNode(true);
            const product = cart.product;
            const price = parseFloat(product.price);

            let imageUrl = "img/bag-filled.png";
            if (product.images && product.images.length > 0) {
                imageUrl = CONFIG.API_BASE_URL + product.images[0].image;
            }
            const removeBtn = clone.querySelector(".remove-item-btn");
            removeBtn.setAttribute("data-id", cart.id);
            clone.querySelector(".mini-cart-img").src = imageUrl;
            clone.querySelector(".mini-cart-name").innerText = product.name;
            clone.querySelector(".mini-cart-quantity").innerText = cart.quantity;
            clone.querySelector(".mini-cart-price").innerText = price.toLocaleString("vi-VN") + "đ";

            subtotal += parseFloat(product.price) * cart.quantity;

            miniCartContainer.appendChild(clone);
        });

        subtotalEl.innerText = subtotal.toLocaleString("vi-VN") + "đ";

    } catch (error) {

        console.error(error);
        miniCartContainer.innerHTML =
            "<p class='text-danger text-center'>Không thể tải giỏ hàng</p>";
    }
}

async function removeItemMiniCart(id) {

    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Vui lòng đăng nhập");
        return;
    }

    try {

        const response = await fetchWithAuth(`/api/cart/${id}/`, {
            method: "DELETE"
        });

        if (response.ok) {
            loadMiniCart();
            updateCartBadge();
        }

    } catch (error) {
        console.error(error);
    }
}

async function loadCart() {
    const template = document.getElementById("template-cart");
    const cartContainer = document.getElementById("cart-item");


    const token = localStorage.getItem("access_token");

    if (!cartContainer || !template) return;
    if (!token) {
        alert("Vui long dang nhap de xem gio hang");
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetchWithAuth(`/api/cart`);

        if (!response.ok) {
            throw new Error("Khong tim thay san pham");
        }

        const data = await response.json();

        cartContainer.innerHTML = '';
        let subtotal = 0;

        if (data.length === 0) {
            const cartItem = document.getElementById("cart-item");
    
            cartItem.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="py-3">
                            <h3 class="fw-bold mb-3">Giỏ Hàng</h3>
                            <h4 class="text-muted">Giỏ hàng của bạn hiện tại đang trống.</h4>
                            <p class="mb-4">Có vẻ như bạn chưa chọn được sản phẩm nào.</p>
                            <a href="detail.html" class="btn-veggie-cart text-decoration-none">
                                HÃY TIẾP TỤC MUA SẮM
                            </a>
                        </div>
                    </td>
                </tr>
            `;

            // Ẩn các phần thừa khác (nếu có) như phần tính phí ship hoặc tổng tiền
            const cartTotals = document.querySelector('.row.g-5');
            if (cartTotals) cartTotals.style.display = 'none';
            
            const actionButtons = document.querySelector('.d-flex.flex-wrap.gap-2.mb-5');
            if (actionButtons) actionButtons.style.display = 'none';

            document.querySelectorAll(".total-price").forEach(el => {
                el.innerText = "0đ";
            });
            return;
        }
        data.forEach(item => {

            const clone = template.content.cloneNode(true);
            const product = item.product;
            const price = parseFloat(product.price);

            let imageUrl = "img/bag-filled.png";
            if (product.images && product.images.length > 0) {
                imageUrl = CONFIG.API_BASE_URL + product.images[0].image;
            }

            const removeBtn = clone.querySelector(".btn-remove-item");
            const minusBtn = clone.querySelector(".btn-minus");
            const plusBtn = clone.querySelector(".btn-plus");

            removeBtn.setAttribute("data-id", item.id);
            minusBtn.setAttribute("data-id", item.id);
            plusBtn.setAttribute("data-id", item.id);

            clone.querySelector(".cart-img").src = imageUrl;
            clone.querySelector(".cart-name").innerText = product.name;
            clone.querySelector(".cart-price").innerText =
                price.toLocaleString("vi-VN") + "đ";

            clone.querySelector(".cart-qty").value = item.quantity;

            const totalItem = price * item.quantity;
            clone.querySelector(".total-price-item").innerText =
                totalItem.toLocaleString("vi-VN") + "đ";

            subtotal += totalItem;

            cartContainer.appendChild(clone);
        });

        document.querySelectorAll(".total-price").forEach(el => {
            el.innerText = subtotal.toLocaleString("vi-VN") + "đ";
        });

        updateShippingUI(0);
        calculateShipping();

    } catch (error) {
        console.error(error);
        cartContainer.innerHTML =
            "<p class='text-danger text-center'>Không thể tải giỏ hàng</p>";
    }

}

async function removeCartItem(id) {

    const isConfirmed = confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?");
    if (!isConfirmed) return; // Nếu khách bấm 'Hủy' thì dừng lại luôn, không chạy code bên dưới

    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Vui lòng đăng nhập");
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/cart/${id}/`, {
            method: "DELETE"
        });

        if (response.ok) {
            console.log("Đã xóa bó rau thành công!"); 
            loadCart();
            loadMiniCart();
            updateCartBadge();
        }

    } catch (error) {
        console.error("Lỗi khi xóa:", error);
    }
}

async function changeQty(button, cartId, amount) {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const container = button.closest(".d-flex") || button.closest("tr");
    const qtyInput = container.querySelector(".cart-qty") || container.querySelector(".mini-cart-quantity");

    let currentQty = parseInt(qtyInput.value || qtyInput.innerText);
    currentQty += amount;

    if (currentQty < 1) return; // Không cho giảm xuống dưới 1

    try {
       const response = await fetchWithAuth(`/api/cart/${cartId}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ quantity: currentQty })
        });

        if (response.ok) {
            await Promise.all([loadCart(), loadMiniCart(), updateCartBadge()]);
        }
    } catch (error) {
        console.error("Lỗi cập nhật số lượng:", error);
    }
}

let listAddresses = [];
let selectedAddressId = null; 
let addressModal;

document.addEventListener('DOMContentLoaded', function() {
    addressModal = new bootstrap.Modal(document.getElementById('addressModal'));
    loadAddresses();
});

function calculateTotalWeight() {
    let total = 0;
    if (typeof cartItems !== 'undefined' && cartItems.length > 0) {
        cartItems.forEach(item => {
            const weight = item.weightGram || item.weight_gram || 0;
            total += (weight * item.quantity);
        });
    }

    const packagingWeight = 300; 
    return total + packagingWeight;
}

async function loadAddresses() {
    try {
        const response = await fetchWithAuth('/api/shippingAddress/user-addresses');
        listAddresses = await response.json();
        
        const defaultAddr = listAddresses.find(addr => addr.default === true) || listAddresses[0];

        if (defaultAddr) {
            selectedAddressId = defaultAddr.id;
            renderAddress(defaultAddr);
            calculateShipping();
        } else {
            document.getElementById('addressDisplay').innerHTML = 
                `<p class="text-danger mb-0">Chưa có địa chỉ. Vui lòng thêm mới!</p>`;
        }
    } catch (error) {
        console.error(error);
    }
}

function renderAddress(addr) {
    const displayDiv = document.getElementById('addressDisplay');
    displayDiv.innerHTML = `
        <div class="address-item">
            <div class="fw-bold text-dark fs-5 mb-1">${addr.fullName}</div>
            <div class="text-secondary mb-1" style="font-size: 0.95rem;">${addr.address}</div>
            <div class="text-muted" style="font-size: 0.9rem;">
                ${addr.ward ? addr.ward + ', ' : ''}${addr.district ? addr.district + ', ' : ''}${addr.city}
            </div>
        </div>
    `;
}

function openAddressModal() {
    const modalList = document.getElementById('modalAddressList');
    modalList.innerHTML = ''; 

    if (listAddresses.length === 0) {
        modalList.innerHTML = '<div class="p-3 text-center">Bạn chưa có địa chỉ nào.</div>';
    } else {
        listAddresses.forEach(addr => {
            const isActive = addr.id === selectedAddressId ? 'border-primary bg-light' : '';
            modalList.innerHTML += `
                <button type="button" class="list-group-item list-group-item-action p-3 ${isActive}" 
                        onclick="selectAddress(${addr.id})">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold text-dark">${addr.fullName}</div>
                            <div class="small text-secondary">${addr.address}</div>
                        </div>
                        ${addr.id === selectedAddressId ? '<i class="fas fa-check-circle text-primary"></i>' : ''}
                    </div>
                </button>
            `;
        });
    }
    addressModal.show();
}

function selectAddress(id) {
    const foundAddr = listAddresses.find(a => a.id === id);
    if (foundAddr) {
        selectedAddressId = id;
        renderAddress(foundAddr);
        addressModal.hide();
        calculateShipping();
    }
}

async function calculateShipping() {
    if (!selectedAddressId) return;

    const addr = listAddresses.find(a => a.id === selectedAddressId);
    const currentWeight = calculateTotalWeight();

    const requestBody = {
        "fromDistrictId": 1451,
        "toDistrictId": parseInt(addr.districtId),
        "toWardCode": String(addr.wardCode),
        "weight": currentWeight,
        "insuranceValue": 0
    };


    const feeDisplay = document.getElementById('shippingFee');
    if(feeDisplay) feeDisplay.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    try {
        const response = await fetch('http://localhost:8080/api/GhnShipping/calculate-fee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (response.ok) {
            const fee = result.total || result.data?.total || result; 
            updateShippingUI(fee);
        } else {
            if(feeDisplay) feeDisplay.innerText = 'Lỗi tính phí';
        }
    } catch (error) {
        console.error(error);
        if(feeDisplay) feeDisplay.innerText = '--';
    }
}

function updateShippingUI(fee = 0) {
    const feeDisplay = document.getElementById('shippingFee');
    const priceElements = document.querySelectorAll('.total-price');
    const subTotalDisplay = priceElements[0]; 
    const totalDisplay = priceElements[1];

    let subTotal = 0;
    const cartRows = document.querySelectorAll('#cart-item tr');
    
    if (cartRows.length > 0) {
        cartRows.forEach(row => {
            const priceText = row.querySelector('.cart-price')?.innerText || "0";
            const qtyInput = row.querySelector('.cart-qty')?.value || "0";
            const price = Number(priceText.replace(/[^0-9]/g, "")) || 0;
            const qty = Number(qtyInput) || 0;
            subTotal += (price * qty);
        });
    }

    if (subTotalDisplay) {
        subTotalDisplay.innerText = subTotal.toLocaleString('vi-VN') + ' đ';
    }

    if (feeDisplay) {
        feeDisplay.innerText = Number(fee).toLocaleString('vi-VN') + ' đ';
    }

    if (totalDisplay) {
        let finalTotal = subTotal + (Number(fee) || 0);
        totalDisplay.innerText = finalTotal.toLocaleString('vi-VN') + ' đ';
    }
}