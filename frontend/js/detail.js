let currentPage = 1;
const urlParams = new URLSearchParams(window.location.search);
let currentCategoryId = urlParams.get('id');
let currentCategoryName = urlParams.get('name');

document.addEventListener("DOMContentLoaded", function () {
    const sidebarContainer = document.getElementById('sidebar-categories');
    const sortSelect = document.getElementById('sort-select');
    const btnFilter = document.querySelector('.btn-veggie');

    function updateHeaders(name) {
        const display = name ? name : 'Tất cả sản phẩm';
        const titleEl = document.getElementById('category-title');
        const breadcrumbEl = document.getElementById('breadcrumb-category');
        if (titleEl) titleEl.innerText = display;
        if (breadcrumbEl) breadcrumbEl.innerText = display;
    }

    updateHeaders(currentCategoryName);

    if (sidebarContainer) {
        fetch(`/api/category/`)
            .then(res => res.json())
            .then(data => {
                sidebarContainer.innerHTML = '';
                data.forEach(cat => {
                    const isActive = cat.id == currentCategoryId ? 'text-success fw-bold' : 'text-dark';
                    const catLink = `
                        <li class="mb-2 pb-2 border-bottom border-light">
                            <a href="javascript:void(0)" data-id="${cat.id}" data-name="${cat.name}"
                               class="category-link text-decoration-none ${isActive} d-flex justify-content-between align-items-center small">
                                 ${cat.name}
                                <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>
                            </a>
                        </li>`;
                    sidebarContainer.insertAdjacentHTML('beforeend', catLink);
                });
            });

        sidebarContainer.addEventListener('click', function (e) {
            const link = e.target.closest('.category-link');
            if (!link) return;
            e.preventDefault();
            currentCategoryId = link.getAttribute('data-id');
            currentCategoryName = link.getAttribute('data-name');
            const url = new URL(window.location);
            url.searchParams.set('id', currentCategoryId);
            url.searchParams.set('name', currentCategoryName);
            window.history.pushState({}, '', url);
            updateHeaders(currentCategoryName);
            applyFilters(1);
        });
    }

    if (btnFilter) btnFilter.addEventListener('click', () => applyFilters(1));
    if (sortSelect) sortSelect.addEventListener('change', () => applyFilters(1));

    applyFilters(1);
});

async function loadProducts(apiUrl) {
    const productContainer = document.getElementById('product-list');
    const template = document.getElementById('product-template');
    productContainer.innerHTML = '<div class="text-center w-100 py-5"><div class="spinner-border text-success"></div></div>';

    try {
        const response = await fetch(apiUrl);
        const res = await response.json();
        productContainer.innerHTML = '';
        const items = res.data || [];

        if (items.length === 0) {
            productContainer.innerHTML = '<div class="col-12 text-center py-5"><h5>Không có sản phẩm.</h5></div>';
            return;
        }

        items.forEach(product => {
            const clone = template.content.cloneNode(true);

            clone.querySelector('#product-img').src = product.images?.[0]?.image || 'img/bag-filled.png';
            clone.querySelector('#product-price').textContent = parseFloat(product.price).toLocaleString('vi-VN') + "đ";
            clone.querySelector('#product-name').textContent = product.name;
            clone.querySelector('#product-unit').textContent = product.unit;

            const btnMinus = clone.querySelector('.btn-minus');
            const btnPlus = clone.querySelector('.btn-plus');
            const inputQty = clone.querySelector('.qty-input');
            const stock = product.stock || 0;

            if (inputQty) inputQty.value = stock > 0 ? 1 : 0;

            if (btnMinus) {
                btnMinus.onclick = function() {
                    let val = parseInt(inputQty.value) || 1;
                    if (val > 1) inputQty.value = val - 1;
                };
            }

            if (btnPlus) {
                btnPlus.onclick = function() {
                    let val = parseInt(inputQty.value) || 1;
                    if (val < stock) inputQty.value = val + 1;
                    else alert("Vượt quá số lượng trong kho!");
                };
            }

            const weightElem = clone.querySelector('#product-weightGram');
            if (weightElem && product.unit !== 'kg') weightElem.textContent = `(${product.weightGram}g)`;

            const addCartBtn = clone.querySelector('.add-cart-btn');
            if (addCartBtn) {
                addCartBtn.setAttribute('data-id', product.id);
                
                addCartBtn.onclick = function() {
                    const token = localStorage.getItem('access_token');
                    const productId = this.getAttribute('data-id');
                    const quantity = parseInt(inputQty.value) || 1;

                    if (!token) {
                        let guestCart = JSON.parse(localStorage.getItem('guest_cart')) || [];
                        let existingItem = guestCart.find(i => i.product.id == productId);
                        if (existingItem) {
                            existingItem.quantity += quantity;
                        } else {
                            guestCart.push({
                                id: 'guest_' + Date.now() + '_' + productId,
                                quantity: quantity,
                                product: product
                            });
                        }
                        localStorage.setItem('guest_cart', JSON.stringify(guestCart));
                        
                        if (typeof updateCartBadge === 'function') updateCartBadge();
                        
                        const modalEl = document.getElementById('successModal');
                        if (modalEl) {
                            document.getElementById('success-product-img').src = product.images?.[0]?.image || 'img/bag-filled.png';
                            document.getElementById('success-product-name').textContent = product.name;
                            new bootstrap.Modal(modalEl).show();
                        }
                    } else {
                        if (typeof addToCart === 'function') addToCart(productId, quantity);
                    }
                };
            }
            productContainer.appendChild(clone);
        });

        renderPagination(res);
    } catch (error) {
        console.error(error);
        productContainer.innerHTML = "<p class='text-center text-danger'>Lỗi tải dữ liệu</p>";
    }
}

function applyFilters(page = 1) {
    currentPage = page;
    let apiUrl = `/api/product?Page=${currentPage}&PageSize=9`;
    if (currentCategoryId) apiUrl += `&categoryid=${currentCategoryId}`;
    loadProducts(apiUrl);
}

function renderPagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    const totalPages = Math.ceil((data.totalItems || 0) / 9);
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        const active = i === currentPage ? 'active' : '';
        html += `<div class="page-btn ${active}" onclick="changePage(${i})">${i}</div>`;
    }
    pagination.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    applyFilters(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}