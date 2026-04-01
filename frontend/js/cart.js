
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

document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    loadCart();

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

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/`)

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

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/`);

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

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/${id}/`, {
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






/// load cart 


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

        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/`);

        if (!response.ok) {
            throw new Error("Khong tim thay san pham");
        }

        const data = await response.json();

        cartContainer.innerHTML = '';
        let subtotal = 0;

        if (data.length === 0) {
            cartContainer.innerHTML = `      
                <div class="row">
                    <div class="col-lg-12 text-start px-5">
                        <h3 class="fw-bold">Giỏ Hàng</h3>
                        <h4>Giỏ hàng của bạn hiện tại đang trống.</h4>
                        <p>Hãy tiếp tục mua sắm</p>
                    </div>
                </div>
            `;
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

    } catch (error) {
        console.error(error);
        cartContainer.innerHTML =
            "<p class='text-danger text-center'>Không thể tải giỏ hàng</p>";
    }
}

async function removeCartItem(id) {

    const token = localStorage.getItem("access_token");
    if (!token) {
        alert("Vui lòng đăng nhập");
        return;
    }

    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/${id}/`, {
            method: "DELETE"
        });

        if (response.ok) {
            loadCart();
            loadMiniCart();
            updateCartBadge();
        }

    } catch (error) {
        console.error(error);
    }
}


async function changeQty(button, cartId, amount) {

    const token = localStorage.getItem("access_token");
    if (!token) return;

    const row = button.closest("tr");
    const qtyInput = row.querySelector(".cart-qty");

    let currentQty = parseInt(qtyInput.value);
    currentQty += amount;

    if (currentQty < 1) currentQty = 1;

    qtyInput.value = currentQty;

    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/cart/${cartId}/`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                quantity: currentQty
            })
        });

        if (response.ok) {
            loadCart();
            loadMiniCart();
            updateCartBadge();
        }

    } catch (error) {
        console.error(error);
    }
}