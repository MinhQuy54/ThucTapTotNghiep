let currentStock = 9999; // Mặc định cao để không chặn +/- trước khi data load
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
        if (categoryEl) categoryEl.innerHTML = `<span class="fw-bold">Danh mục:</span> ${product.categoryName || 'Không xác định'}`;
        
        const categoryTitleEl = document.getElementById("category-title");
        if (categoryTitleEl) categoryTitleEl.innerText = product.name;

        // Cập nhật trạng thái kho
        const stockStatus = document.querySelector(".stock-status");
        const addBtn = document.querySelector(".btn-add-to-cart");
        if (stockStatus && addBtn) {
            if (product.stock < 1) {
                stockStatus.innerHTML = '<i class="fas fa-times-circle me-1"></i> Hết hàng';
                stockStatus.className = 'stock-status mb-3 fw-bold small text-danger';
                addBtn.disabled = true;
            } else {
                stockStatus.innerHTML = `<i class="fas fa-check-circle me-1"></i> Còn hàng (${product.stock})`;
                stockStatus.className = 'stock-status mb-3 fw-bold small text-success';
                addBtn.disabled = false;
            }
        }

        // Hiển thị số lượng bán
        const soldEl = document.getElementById("product-sold");
        if (soldEl && product.sold) {
            soldEl.innerText = `${product.sold} người đã mua`;
        }

    } catch (error) {
        const detailsEl = document.querySelector(".product-details");
        if (detailsEl) detailsEl.innerHTML = "<div class='text-center text-danger py-5'>Không tìm thấy sản phẩm</div>";
    }
}

window.changeQty = function changeQty(amount) {
    const qtyInput = document.getElementById("qty-input");
    if (!qtyInput) return;
    let currentQty = parseInt(qtyInput.value) || 1;
    currentQty += amount;
    if (currentQty < 1) currentQty = 1;
    if (currentStock > 0 && currentQty > currentStock) currentQty = currentStock;
    qtyInput.value = currentQty;
};

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

function showCartToast() {
    // Xóa toast cũ nếu có
    const old = document.getElementById('cart-toast-msg');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id = 'cart-toast-msg';
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; z-index: 9999;
        background: #78a206; color: #fff; padding: 14px 22px;
        border-radius: 8px; font-weight: 600; font-size: 0.9rem;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
    `;
    toast.innerHTML = '<i class="fa-solid fa-cart-shopping me-2"></i>Đã thêm vào giỏ hàng!';

    if (!document.getElementById('cart-toast-style')) {
        const style = document.createElement('style');
        style.id = 'cart-toast-style';
        style.textContent = `
            @keyframes slideInRight { from { opacity:0; transform:translateX(50px); } to { opacity:1; transform:translateX(0); } }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
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
        showCartToast();

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

        showCartToast();

        if (typeof updateCartBadge === "function") updateCartBadge();
        if (typeof loadMiniCart === "function") loadMiniCart();

    } catch (error) {
        console.error('addToCart error:', error);
        alert('Có lỗi khi thêm vào giỏ. Vui lòng thử lại.');
    }
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