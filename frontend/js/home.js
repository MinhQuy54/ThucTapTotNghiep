document.addEventListener("DOMContentLoaded", () => {
    loadHomepageBanners();
    loadCategories();
    loadFeaturedProducts();
    loadAllProducts();
});

let wishlistIds = [];

async function fetchWishlistIds() {
    const token = localStorage.getItem('access_token');
    if (!token) return [];
    try {
        const res = await fetchWithAuth('/api/wishlist/GetUserWishlist');
        if (res.ok) {
            const data = await res.json();
            return (data.data || []).map(item => String(item.id || item.Id));
        }
    } catch (e) {
        console.error(e);
    }
    return [];
}

async function loadCategories() {
    const categoryList = document.getElementById("category-list");
    const template = document.getElementById("category-template");
    if (!categoryList || !template) return;

    try {
        const res = await fetch("/api/category");
        const categories = await res.json();
        
        categoryList.innerHTML = '';
        categories.forEach(cat => {
            const clone = template.content.cloneNode(true);
            const link = clone.querySelector(".category-link");
            const img = clone.querySelector(".category-img");
            const name = clone.querySelector(".category-name");
            const desc = clone.querySelector(".category-desc");

            link.href = `detail.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}`;
            if(cat.image) {
                img.src = cat.image.startsWith('/media') ? cat.image : `/media/${cat.image}`;
            } else {
                img.src = 'img/default-category.png';
            }
            name.textContent = cat.name;
            desc.textContent = cat.description ? (cat.description.substring(0, 50) + '...') : '';

            categoryList.appendChild(clone);
        });
    } catch (e) {
        console.error("Lỗi tải danh mục:", e);
    }
}

async function renderProducts(apiUrl, containerId, limit = 0) {
    const container = document.getElementById(containerId);
    const template = document.getElementById("product-template");
    if (!container || !template) return;

    container.innerHTML = '<div class="text-center w-100"><div class="spinner-border text-success"></div></div>';

    try {
        if(wishlistIds.length === 0) {
            wishlistIds = await fetchWishlistIds();
        }

        const res = await fetch(apiUrl);
        const data = await res.json();
        let products = data.data || [];
        
        if (limit > 0) products = products.slice(0, limit);

        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<p class="text-center w-100 text-muted">Không có sản phẩm nào.</p>';
            return;
        }

        products.forEach(product => {
            const clone = template.content.cloneNode(true);
            
            const img = clone.querySelector("#product-img");
            if (img) img.src = product.images?.[0]?.image || 'img/default-product.png';

            const name = clone.querySelector("#product-name");
            if (name) name.textContent = product.name;

            const price = clone.querySelector("#product-price");
            if (price) price.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

            const catName = clone.querySelector("#category-name");
            if (catName) catName.textContent = product.categoryName;

            const links = clone.querySelectorAll("#product-link-detail, .quick-view-btn");
            links.forEach(l => {
                if (l.tagName === 'A') l.href = `product-details.html?id=${product.id}`;
                else l.setAttribute('data-id', product.id);
            });

            const addCartBtn = clone.querySelector('.add-cart-btn');
            if (addCartBtn) {
                addCartBtn.onclick = function() {
                    const token = localStorage.getItem('access_token');
                    if (!token) {
                        // Guest cart logic (simplified)
                        alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
                        window.location.href = "login.html";
                    } else {
                        if (typeof addToCart === 'function') addToCart(product.id, 1);
                    }
                };
            }

            const wishlistBtn = clone.querySelector('.add-wish-btn');
            if (wishlistBtn) {
                wishlistBtn.setAttribute('data-id', product.id);
                const icon = wishlistBtn.querySelector('i');
                if (wishlistIds.includes(String(product.id))) {
                    wishlistBtn.classList.add('active');
                    if (icon) icon.classList.replace('fa-regular', 'fa-solid');
                }

                wishlistBtn.onclick = async function() {
                    const token = localStorage.getItem('access_token');
                    if (!token) {
                        alert("Vui lòng đăng nhập để thêm vào danh sách yêu thích!");
                        return;
                    }
                    const isActive = this.classList.contains('active');
                    try {
                        const url = isActive ? `/api/wishlist/Remove?productId=${product.id}` : `/api/wishlist/Add?productId=${product.id}`;
                        const res = await fetchWithAuth(url, { method: 'POST' });
                        if (res.ok) {
                            if (isActive) {
                                this.classList.remove('active');
                                if (icon) icon.classList.replace('fa-solid', 'fa-regular');
                                wishlistIds = wishlistIds.filter(id => id !== String(product.id));
                            } else {
                                this.classList.add('active');
                                if (icon) icon.classList.replace('fa-regular', 'fa-solid');
                                wishlistIds.push(String(product.id));
                            }
                        }
                    } catch (e) {
                        console.error("Lỗi cập nhật wishlist", e);
                    }
                };
            }

            container.appendChild(clone);
        });

    } catch (e) {
        console.error("Lỗi tải sản phẩm:", e);
        container.innerHTML = "<p class='text-center text-danger w-100'>Lỗi tải dữ liệu sản phẩm</p>";
    }
}

async function loadFeaturedProducts() {
    // Sắp xếp theo bán chạy nhất (-sold_count) hoặc yêu thích (-average_rating), ở đây ví dụ lấy bán chạy
    await renderProducts('/api/product?Page=1&PageSize=4&Ordering=-sold_count', 'featured-product-list', 4);
}

async function loadAllProducts() {
    await renderProducts('/api/product?Page=1&PageSize=8', 'product-list', 8);
}

async function loadHomepageBanners() {
    const bannerContainer = document.getElementById("homepage-banners");
    const fallbackContainer = document.getElementById("homepage-banners-fallback");
    const bannerTemplate = document.getElementById("homepage-banner-template");

    if (!bannerContainer || !fallbackContainer || !bannerTemplate) {
        return;
    }

    try {
        const response = await fetch("/api/banners/?position=home");

        if (!response.ok) {
            throw new Error(`Banner API returned ${response.status}`);
        }

        const banners = await response.json();

        if (!Array.isArray(banners) || banners.length === 0) {
            return;
        }

        const fragment = document.createDocumentFragment();

        banners.forEach((banner) => {
            const clone = bannerTemplate.content.cloneNode(true);
            const card = clone.querySelector(".promo-banner-card");
            const image = clone.querySelector(".promo-banner-image");
            const title = clone.querySelector(".promo-banner-title");
            const description = clone.querySelector(".promo-banner-description");
            const link = clone.querySelector(".promo-banner-link");

            title.textContent = banner.title || "Thong bao uu dai";
            description.textContent = banner.description?.trim() || "Uu dai moi dang dien ra tai Veggie. Ghe ngay de khong bo lo.";

            const imageUrl = resolveBannerImageUrl(banner.image_url);
            if (imageUrl) {
                image.src = imageUrl;
                image.alt = banner.title || "Banner Veggie";
            } else {
                card.classList.add("no-image");
            }

            const targetLink = normalizeBannerLink(banner.link);
            if (targetLink) {
                link.href = targetLink;
                link.textContent = `${(banner.button_text || "Xem ngay").trim()} ->`;
            } else {
                link.classList.add("d-none");
            }

            fragment.appendChild(clone);
        });

        bannerContainer.replaceChildren(fragment);
        bannerContainer.classList.remove("d-none");
        fallbackContainer.classList.add("d-none");
    } catch (error) {
        console.error("Khong tai duoc banner trang chu:", error);
    }
}

function resolveBannerImageUrl(imageUrl) {
    if (!imageUrl) {
        return "";
    }

    if (/^https?:/i.test(imageUrl)) {
        try {
            const parsedUrl = new URL(imageUrl);
            if (parsedUrl.pathname.startsWith("/media/")) {
                return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
            }
            return parsedUrl.href;
        } catch (error) {
            console.error(error);
            return imageUrl;
        }
    }

    return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
}

function normalizeBannerLink(link) {
    if (!link) {
        return "";
    }

    if (/^(https?:|mailto:|tel:|\/|#)/i.test(link)) {
        return link;
    }

    return `/${String(link).replace(/^\/+/, "")}`;
}
