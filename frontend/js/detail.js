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
                        </li>
                    `;
                    sidebarContainer.insertAdjacentHTML('beforeend', catLink);
                });
            });

        sidebarContainer.addEventListener('click', function (e) {
            const link = e.target.closest('.category-link');
            if (!link) return;

            e.preventDefault();

            const clickedId = link.getAttribute('data-id');
            const clickedName = link.getAttribute('data-name');
            const url = new URL(window.location);

            if (currentCategoryId === clickedId) {
                currentCategoryId = null;
                currentCategoryName = null;
                url.searchParams.delete('id');
                url.searchParams.delete('name');
            } else {
                currentCategoryId = clickedId;
                currentCategoryName = clickedName;
                url.searchParams.set('id', currentCategoryId);
                url.searchParams.set('name', currentCategoryName);
            }

            window.history.pushState({}, '', url);

            document.querySelectorAll('.category-link').forEach(el => {
                if (el.getAttribute('data-id') === currentCategoryId) {
                    el.classList.add('text-success', 'fw-bold');
                    el.classList.remove('text-dark');
                } else {
                    el.classList.remove('text-success', 'fw-bold');
                    el.classList.add('text-dark');
                }
            });

            updateHeaders(currentCategoryName);
            applyFilters(1);
        });
    }

    if (btnFilter) {
        btnFilter.addEventListener('click', function (e) {
            e.preventDefault();
            applyFilters(1);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            applyFilters(1);
        });
    }

    applyFilters(1);
});

async function loadProducts(apiUrl) {
    const productContainer = document.getElementById('product-list');
    const template = document.getElementById('product-template');

    productContainer.innerHTML = `
        <div class="text-center w-100 py-5">
            <div class="spinner-border text-success"></div>
        </div>`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Không có sản phẩm");

        const res = await response.json();
        productContainer.innerHTML = '';
        
        // res.data là mảng sản phẩm để vẽ giao diện
        const items = res.data || [];

        if (items.length === 0) {
            productContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h5 class="text-muted">Không tìm thấy sản phẩm phù hợp.</h5>
                </div>`;
            renderPagination({ count: 0 });
            return;
        }

        items.forEach(product => {
            const clone = template.content.cloneNode(true);
            const price = parseFloat(product.price);
            let imageUrl = 'img/bag-filled.png';

            if (product.images && product.images.length > 0) {
                imageUrl = product.images[0].image;
            }

            const quickViewBtn = clone.querySelector(".quick-view-btn");
            if (quickViewBtn) quickViewBtn.setAttribute("data-id", product.id);

            clone.querySelector('#product-img').src = imageUrl;
            clone.querySelector('#product-price').textContent = price.toLocaleString('vn-VN') + "đ";
            clone.querySelector('#category-name').textContent = product.category_name;
            clone.querySelector('#product-name').textContent = product.name;
            clone.querySelector('#product-link-detail').href = `product-details.html?id=${product.id}`;

            const addCartBtn = clone.querySelector(".add-cart-btn");
            if (addCartBtn) addCartBtn.setAttribute("data-id", product.id);

            productContainer.appendChild(clone);
        });

        // QUAN TRỌNG: Truyền toàn bộ 'res' (có chứa count) vào hàm phân trang
        renderPagination(res);

    } catch (error) {
        console.error(error);
        productContainer.innerHTML = "<p class='text-danger text-center'>Không thể tải sản phẩm</p>";
    }
}

function applyFilters(page = 1) {
    currentPage = parseInt(page);

    const minPriceEl = document.querySelector('input[placeholder="From Vnd"]');
    const maxPriceEl = document.querySelector('input[placeholder="To Vnd"]');
    const sortSelectEl = document.getElementById('sort-select');

    const minPrice = minPriceEl ? minPriceEl.value : '';
    const maxPrice = maxPriceEl ? maxPriceEl.value : '';
    const sortValue = sortSelectEl ? sortSelectEl.value : '';

    const stockStatusEl = document.querySelector('input[name="stockStatus"]:checked');
    const stockStatus = stockStatusEl ? stockStatusEl.value : '';

    let apiUrl = `/api/product?Page=${currentPage}&PageSize=9`;

    if (currentCategoryId) apiUrl += `&categoryid=${currentCategoryId}`;
    if (minPrice) apiUrl += `&minprice=${minPrice}`;
    if (maxPrice) apiUrl += `&maxprice=${maxPrice}`;
    if (sortValue) apiUrl += `&ordering=${sortValue}`;
    if (stockStatus && stockStatus !== 'all') {
        apiUrl += `&stock=${stockStatus}`;
    }

    loadProducts(apiUrl);
}

function changePage(page) {
    currentPage = parseInt(page);
    applyFilters(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';

    const totalCount = data.totalItems !== undefined ? data.totalItems : (Array.isArray(data) ? data.length : 0);
    
    const totalPages = Math.ceil(totalCount / 9);

    console.log("Dữ liệu thực tế - Total Items:", totalCount, "Total Pages:", totalPages);

    if (totalPages <= 1) return; 

    let html = '';

    if (currentPage > 1) {
        html += `
            <div class="page-btn" onclick="changePage(${currentPage - 1})">
                <i class="fa-solid fa-angles-left"></i>
            </div>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === parseInt(currentPage) ? 'active' : '';
        html += `
            <div class="page-btn ${activeClass}" onclick="changePage(${i})">
                ${i}
            </div>`;
    }

    if (currentPage < totalPages) {
        html += `
            <div class="page-btn" onclick="changePage(${currentPage + 1})">
                <i class="fa-solid fa-angles-right"></i>
            </div>`;
    }

    pagination.innerHTML = html;
}