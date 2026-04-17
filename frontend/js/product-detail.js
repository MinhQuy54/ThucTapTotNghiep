let currentStock = 0;
let currentProductId = null;

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return;
    
    currentProductId = productId;
    try {
        const response = await fetch(`/api/product/${productId}/`);
        if (!response.ok) throw new Error("Không tìm thấy sản phẩm");
        
        const product = await response.json();
        currentStock = product.stock;
        
        const qtyInputEl = document.getElementById("qty-input");
        if (qtyInputEl) qtyInputEl.value = 1;

        const nameEl = document.getElementById("product-name");
        if (nameEl) nameEl.innerText = product.name;
        
        const priceEl = document.getElementById("product-price");
        if (priceEl) priceEl.innerText = new Intl.NumberFormat("vi-VN").format(product.price) + "đ";
        
        const descEl = document.getElementById("product-desc");
        if (descEl) descEl.innerText = product.description || "Chưa có mô tả";

        if (product.images && product.images.length > 0) {
            const imgEl = document.getElementById("product-img");
            if (imgEl) imgEl.src = CONFIG.API_BASE_URL + product.images[0].image;
        }

        const breadcrumbEl = document.getElementById("breadcrumb-category");
        if (breadcrumbEl) breadcrumbEl.innerText = product.name;
        
        const categoryEl = document.getElementById("category");
        if (categoryEl) categoryEl.innerHTML = `<span class="fw-bold">Categories:</span> ${product.category_name}`;
        
        const categoryTitleEl = document.getElementById("category-title");
        if (categoryTitleEl) categoryTitleEl.innerText = product.name;

    } catch (error) {
        const detailsEl = document.querySelector(".product-details");
        if (detailsEl) detailsEl.innerHTML = "<div class='text-center text-danger py-5'>Không tìm thấy sản phẩm</div>";
    }
}

function changeQty(amount) {
    const qtyInput = document.getElementById("qty-input");
    if (!qtyInput) return;
    let currentQty = parseInt(qtyInput.value);
    currentQty += amount;
    if (currentQty < 1) currentQty = 1;
    if (currentQty > currentStock) currentQty = currentStock;
    qtyInput.value = currentQty;
}

document.addEventListener("click", async function (e) {
    if (e.target.closest(".quick-view-btn")) {
        const button = e.target.closest(".quick-view-btn");
        const productId = button.getAttribute("data-id");
        currentProductId = productId;
        try {
            const response = await fetch(`/api/product/${productId}/`);
            if (!response.ok) throw new Error("Không tìm thấy sản phẩm");
            
            const product = await response.json();
            currentStock = product.stock;
            
            const qtyInputEl = document.getElementById("qty-input");
            if (qtyInputEl) qtyInputEl.value = 1;
            
            document.getElementById("modal-product-name").innerText = product.name;
            document.getElementById("modal-product-price").innerText = new Intl.NumberFormat("vi-VN").format(product.price) + "đ";
            document.getElementById("modal-product-desc").innerText = product.description || "Chưa có mô tả";
            document.getElementById("modal-category-name").innerText = product.categoryName;

            const DEFAULT_IMAGE = "img/bag-filled.png";
            if (product.images && product.images.length > 0) {
                document.getElementById("modal-product-img").src = CONFIG.API_BASE_URL + product.images[0].image;
            } else {
                document.getElementById("modal-product-img").src = DEFAULT_IMAGE;
            }

            const stockStatus = document.querySelector(".stock-status");
            const addBtn = document.querySelector(".btn-add-to-cart");

            if (product.stock < 1) {
                stockStatus.innerHTML = '<i class="fas fa-times-circle me-1"></i> Hết hàng';
                stockStatus.classList.remove("text-success");
                stockStatus.classList.add("text-danger");
                addBtn.disabled = true;
            } else {
                stockStatus.innerHTML = '<i class="fas fa-check-circle me-1"></i> Còn hàng';
                stockStatus.classList.remove("text-danger");
                stockStatus.classList.add("text-success");
                addBtn.disabled = false;
            }
        } catch (error) {}
    }
});

function showSuccessModal() {
    const quickModalEl = document.getElementById('quickViewDetailModal');
    if (quickModalEl) {
        const quickModal = bootstrap.Modal.getInstance(quickModalEl);
        if (quickModal) quickModal.hide();
    }
    const successModalEl = document.getElementById('successModal');
    if (successModalEl) {
        const successModal = new bootstrap.Modal(successModalEl);
        successModal.show();
    }
}

async function updateSuccessModalFromCard(productId) {
    const response = await fetch(`/api/product/${productId}/`);
    const product = await response.json();
    document.getElementById("success-product-name").innerText = product.name;
    const DEFAULT_IMAGE = "img/bag-filled.png";
    if (product.images && product.images.length > 0) {
        document.getElementById("success-product-img").src = CONFIG.API_BASE_URL + product.images[0].image;
    } else {
        document.getElementById("success-product-img").src = DEFAULT_IMAGE;
    }
}

async function addToCart(productId = null, customQuantity = null) {
    if (!productId) productId = currentProductId;
    if (!productId) return;

    let quantity = 1;
    if (customQuantity !== null) {
        quantity = customQuantity;
    } else {
        const qtyInput = document.getElementById("qty-input");
        if (qtyInput) quantity = parseInt(qtyInput.value) || 1;
    }

    let productInfo = null;
    try {
        const res = await fetch(`/api/product/${productId}/`);
        productInfo = await res.json();
    } catch (e) {
        alert("Lỗi khi lấy thông tin sản phẩm");
        return;
    }

    if (productInfo.stock < 1) {
        alert("Sản phẩm đã hết hàng");
        return;
    }

    if (quantity > productInfo.stock) {
        alert("Số lượng vượt quá tồn kho");
        return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
        let cart = JSON.parse(localStorage.getItem("guest_cart")) || [];
        
        const existingItem = cart.find(item => 
            (item.product && item.product.id == productId) || 
            item.product_id == productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: 'guest_' + Date.now(),
                product_id: productId,
                quantity: quantity,
                product: {
                    id: productInfo.id || productId,
                    name: productInfo.name,
                    price: productInfo.price,
                    weightgram: productInfo.weightgram || productInfo.weightGram || 0,
                    stock: productInfo.stock,
                    images: productInfo.images || []
                }
            });
        }
        
        localStorage.setItem("guest_cart", JSON.stringify(cart));
        updateSuccessModalFromCard(productId);
        showSuccessModal();
        
        if (typeof updateCartBadge === "function") updateCartBadge();
        if (typeof loadMiniCart === "function") loadMiniCart();
        return;
    }

    try {
        const response = await fetchWithAuth(`/api/cart`, {
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
        
        if (typeof updateCartBadge === "function") updateCartBadge();
        if (typeof loadMiniCart === "function") loadMiniCart();
        
    } catch (error) {}
}

window.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('id')) {
        loadProductDetail();
    }
    
    // Validate qty input khi user nhập trực tiếp
    const qtyInput = document.getElementById("qty-input");
    if (qtyInput) {
        qtyInput.addEventListener("input", function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) value = 1;
            if (value > currentStock) value = currentStock;
            this.value = value;
        });
        
        qtyInput.addEventListener("change", function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) value = 1;
            if (value > currentStock) value = currentStock;
            this.value = value;
        });
    }
});