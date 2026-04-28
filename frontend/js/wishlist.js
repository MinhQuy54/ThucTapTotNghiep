document.addEventListener("DOMContentLoaded", () => {
    loadWishlist();
});

async function loadWishlist() {
    const productContainer = document.getElementById('product-list');
    const template = document.getElementById('product-template');
    
    const token = localStorage.getItem('access_token');
    if (!token) {
        productContainer.innerHTML = '<div class="col-12 text-center py-5"><h5>Vui lòng <a href="login.html?redirect=wishlist.html">đăng nhập</a> để xem sản phẩm yêu thích.</h5></div>';
        return;
    }

    try {
        const response = await fetchWithAuth('/api/wishlist/GetUserWishlist');
        if (!response.ok) throw new Error("Failed to load wishlist");
        const res = await response.json();
        
        productContainer.innerHTML = '';
        const items = res.data || [];

        if (items.length === 0) {
            productContainer.innerHTML = '<div class="col-12 text-center py-5"><h5>Danh sách yêu thích của bạn đang trống.</h5><a href="detail.html" class="btn btn-veggie mt-3 text-white">Mua sắm ngay</a></div>';
            return;
        }

        items.forEach(productWrapper => {
            const product = productWrapper.product || productWrapper; // Adjust depending on API response structure
            if (!product) return;

            const clone = template.content.cloneNode(true);

            clone.querySelector('#product-img').src = (product.images && product.images.length > 0) ? product.images[0].image : 'img/bag-filled.png';
            clone.querySelector('#product-price').textContent = parseFloat(product.price).toLocaleString('vi-VN') + "đ";
            clone.querySelector('#product-name').textContent = product.name;
            clone.querySelector('#product-unit').textContent = product.unit;

            const detailUrl = `product-details.html?id=${product.id}`;
            clone.querySelectorAll('.product-link-detail').forEach(a => a.href = detailUrl);

            const weightElem = clone.querySelector('#product-weightGram');
            if (weightElem && product.unit !== 'kg') weightElem.textContent = `(${product.weightGram}g)`;

            const addCartBtn = clone.querySelector('.add-cart-btn');
            if (addCartBtn) {
                addCartBtn.setAttribute('data-id', product.id);
                addCartBtn.onclick = function () {
                    window.location.href = detailUrl;
                };
            }

            const wishlistBtn = clone.querySelector('.wishlist-btn');
            if (wishlistBtn) {
                wishlistBtn.setAttribute('data-id', product.id);
                wishlistBtn.onclick = async function () {
                    const productId = this.getAttribute('data-id');
                    try {
                        const url = `/api/wishlist/Remove?productId=${productId}`;
                        const response = await fetchWithAuth(url, { method: 'POST' });

                        if (response.ok) {
                            // Xóa sản phẩm khỏi giao diện
                            this.closest('.col-6').remove();
                            
                            // Nếu không còn sản phẩm nào
                            if (document.querySelectorAll('#product-list .col-6').length === 0) {
                                productContainer.innerHTML = '<div class="col-12 text-center py-5"><h5>Danh sách yêu thích của bạn đang trống.</h5><a href="detail.html" class="btn btn-veggie mt-3 text-white">Mua sắm ngay</a></div>';
                            }
                        } else {
                            console.error('Lỗi khi cập nhật wishlist');
                        }
                    } catch (error) {
                        console.error("Lỗi khi kết nối cập nhật wishlist:", error);
                    }
                };
            }

            productContainer.appendChild(clone);
        });
    } catch (error) {
        console.error(error);
        productContainer.innerHTML = '<div class="col-12 text-center py-5 text-danger"><h5>Đã xảy ra lỗi khi tải danh sách yêu thích.</h5></div>';
    }
}
