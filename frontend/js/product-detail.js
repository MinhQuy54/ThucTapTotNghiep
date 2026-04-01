
let currentStock = 0;
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) {
        console.error("Không tìm thấy ID sản phẩm");
        return;
    }
    currentProductId = productId;
    try {
        const response = await fetch(`/api/product/${productId}/`);
        console.log(response);
        if (!response.ok) {
            throw new Error("Không tìm thấy sản phẩm");
        }

        const product = await response.json();
        currentStock = product.stock;
        document.getElementById("qty-input").value = 1;

        document.getElementById("product-name").innerText = product.name;
        document.getElementById("product-price").innerText =
            new Intl.NumberFormat("vi-VN").format(product.price) + "đ";
        document.getElementById("product-desc").innerText =
            product.description || "Chưa có mô tả";

        if (product.images && product.images.length > 0) {
            document.getElementById("product-img").src =
                CONFIG.API_BASE_URL + product.images[0].image;
        }

        document.getElementById("breadcrumb-category").innerText = product.name;
        document.getElementById("category").innerHTML =
            `<span class="fw-bold">Categories:</span> ${product.category_name}`;
        document.getElementById("category-title").innerText = product.name;

    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
        document.querySelector(".product-details").innerHTML =
            "<div class='text-center text-danger py-5'>Không tìm thấy sản phẩm</div>";
    }
}

function changeQty(amount) {
    const qtyInput = document.getElementById("qty-input");
    let currentQty = parseInt(qtyInput.value);
    currentQty += amount;
    if (currentQty < 1) currentQty = 1;
    if (currentQty > currentStock) {
        currentQty = currentStock;
    }
    qtyInput.value = currentQty;

}


document.addEventListener("click", async function (e) {
    if (e.target.closest(".quick-view-btn")) {

        const button = e.target.closest(".quick-view-btn");
        const productId = button.getAttribute("data-id");

        currentProductId = productId;
        try {
            const response = await fetch(`/api/product/${productId}/`);

            console.log(response);

            if (!response.ok) {
                throw new Error("Không tìm thấy sản phẩm");
            }

            const product = await response.json();
            currentStock = product.stock;

            document.getElementById("qty-input").value = 1;
            document.getElementById("modal-product-name").innerText = product.name;

            document.getElementById("modal-product-price").innerText =
                new Intl.NumberFormat("vi-VN").format(product.price) + "đ";

            document.getElementById("modal-product-desc").innerText =
                product.description || "Chưa có mô tả";

            document.getElementById("modal-category-name").innerText =
                product.categoryName;

            const DEFAULT_IMAGE = "img/bag-filled.png";
            if (product.images && product.images.length > 0) {
                document.getElementById("modal-product-img").src =
                    CONFIG.API_BASE_URL + product.images[0].image; // sua lai sau
            } else {
                document.getElementById("modal-product-img").src = DEFAULT_IMAGE;
            }

            const stockStatus = document.querySelector(".stock-status");
            const addBtn = document.querySelector(".btn-add-to-cart");

            if (product.stock < 1) {
                stockStatus.innerHTML =
                    '<i class="fas fa-times-circle me-1"></i> Hết hàng';
                stockStatus.classList.remove("text-success");
                stockStatus.classList.add("text-danger");

                addBtn.disabled = true;
            } else {
                stockStatus.innerHTML =
                    '<i class="fas fa-check-circle me-1"></i> Còn hàng';
                stockStatus.classList.remove("text-danger");
                stockStatus.classList.add("text-success");

                addBtn.disabled = false;
            }


        } catch (error) {
            console.error("Lỗi khi load sản phẩm:", error);
        }
    }
});


function showSuccessModal() {

    const quickModalEl = document.getElementById('quickViewDetailModal');
    const quickModal = bootstrap.Modal.getInstance(quickModalEl);
    if (quickModal) quickModal.hide();

    // mở success
    const successModal = new bootstrap.Modal(
        document.getElementById('successModal')
    );
    successModal.show();
}

async function updateSuccessModalFromCard(productId) {

    const response = await fetch(`/api/product/${productId}/`);
    const product = await response.json();

    document.getElementById("success-product-name").innerText = product.name;

    const DEFAULT_IMAGE = "img/bag-filled.png";
    if (product.images && product.images.length > 0) {
        document.getElementById("success-product-img").src =
            CONFIG.API_BASE_URL + product.images[0].image; // sua lai sau
    } else {
        document.getElementById("success-product-img").src = DEFAULT_IMAGE;
    }
}

document.addEventListener("click", function (e) {

    const cartBtn = e.target.closest(".add-cart-btn");
    if (!cartBtn) return;

    const productId = cartBtn.getAttribute("data-id");
    addToCart(productId);

});

async function addToCart(productId = null) {

    // nếu không truyền id → dùng id đang mở trong quickview
    if (!productId) {
        productId = currentProductId;
    }

    if (!productId) {
        console.error("Không có productId");
        return;
    }

    let quantity = 1;
    const qtyInput = document.getElementById("qty-input");
    if (qtyInput) {
        quantity = parseInt(qtyInput.value) || 1;
    }
    // Nếu add từ icon card → phải fetch lại stock
    let stockToCheck = currentStock;

    if (!currentStock || productId !== currentProductId) {
        const res = await fetch(`/api/product/${productId}/`);
        const product = await res.json();
        stockToCheck = product.stock;
    }

    if (stockToCheck < 1) {
        alert("Sản phẩm đã hết hàng");
        return;
    }

    if (quantity > stockToCheck) {
        alert("Số lượng vượt quá tồn kho");
        return;
    }
    const token = localStorage.getItem("access_token");

    if (!token) {

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingItem = cart.find(item =>
            item.product == productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product_id: productId,
                quantity: quantity
            });
        }

        localStorage.setItem("cart", JSON.stringify(cart));

        updateSuccessModalFromCard(productId);
        showSuccessModal();
        return;
    }

    try {

        const response = await fetchWithAuth(`/api/cart/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Không thể thêm vào giỏ");
            return;
        }

        updateSuccessModalFromCard(productId);
        showSuccessModal();

    } catch (error) {
        console.error(error);
    }
}
window.addEventListener("DOMContentLoaded", loadProductDetail);

