document.addEventListener("DOMContentLoaded", function () {

    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');
    const categoryName = urlParams.get('name');


    const sidebarContainer = document.getElementById('sidebar-categories');
    const sortSelect = document.getElementById('sort-select');
    const btnFilter = document.querySelector('.btn-veggie');

    if (categoryName) {
        document.getElementById('category-title').innerText = categoryName;
        document.getElementById('breadcrumb-category').innerText = categoryName;
    }

    if (sidebarContainer) {
        fetch(`/api/category/`)
            .then(res => res.json())
            .then(data => {
                sidebarContainer.innerHTML = '';
                data.forEach(cat => {
                    const isActive = cat.id == categoryId ? 'text-success fw-bold' : 'text-dark';
                    const catLink = `
                        <li class="mb-2 pb-2 border-bottom border-light">
                            <a href="detail.html?id=${cat.id}&name=${cat.name}" 
                               class="text-decoration-none ${isActive} d-flex justify-content-between align-items-center small">
                                ${cat.name}
                                <i class="fa-solid fa-chevron-right" style="font-size: 0.7rem;"></i>
                            </a>
                        </li>
                    `;
                    sidebarContainer.insertAdjacentHTML('beforeend', catLink);
                });
            });
    }
    if (btnFilter) {
        btnFilter.addEventListener('click', function (e) {
            e.preventDefault();
            applyFilters();
        });
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            applyFilters();
        });
    }

    applyFilters();
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

        if (!response.ok) {
            throw new Error("Không có sản phẩm");
        }

        const data = await response.json();

        productContainer.innerHTML = '';

        const items = data.data;

        if (items.length === 0) {
            productContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <h5 class="text-muted">Không tìm thấy sản phẩm phù hợp.</h5>
                </div>`;
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
            quickViewBtn.setAttribute("data-id", product.id);

            clone.querySelector('#product-img').src = imageUrl;
            clone.querySelector('#product-price').textContent = price.toLocaleString('vn-VN') + "đ";
            clone.querySelector('#category-name').textContent = product.category_name;
            clone.querySelector('#product-name').textContent = product.name;
            clone.querySelector('#product-link-detail').href = `product-details.html?id=${product.id}`;
            clone.querySelector(".add-cart-btn").setAttribute("data-id", product.id);
            productContainer.appendChild(clone);
            renderPagination(data);
        })
    } catch (error) {
        console.error(error);
        productContainer.innerHTML =
            "<p class='text-danger text-center'>Không thể tải sản phẩm</p>";
    }
}


function applyFilters(page = 1) {

    currentPage = page;

    const minPrice = document.querySelector('input[placeholder="From Vnd"]').value;
    const maxPrice = document.querySelector('input[placeholder="To Vnd"]').value;
    const sortValue = document.getElementById('sort-select').value;
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('id');

    let apiUrl = `/api/product?Page=${page}&PageSize=9`;

    if (categoryId) apiUrl += `&category_id=${categoryId}`;
    if (minPrice) apiUrl += `&minprice=${minPrice}`;
    if (maxPrice) apiUrl += `&maxprice=${maxPrice}`;

    if (sortValue) {
        apiUrl += `&ordering=${sortValue}`;
    }

    console.log("➡️ API URL:", apiUrl);

    loadProducts(apiUrl);
}

function changePage(page) {
    currentPage = page;
    applyFilters(page);
}
let currentPage = 1;

function renderPagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = '';
    const totalCount = data.count !== undefined ? data.count : (Array.isArray(data) ? data.length : 0);
    const totalPages = Math.ceil(totalCount / 9);
    if (totalPages <= 1) return;

    let html = '';

    // Nút Previous
    if (currentPage > 1) {
        html += `
            <div class="page-btn" onclick="changePage(${currentPage - 1})">
                <i class="fa-solid fa-angles-left"></i>
            </div>`;
    }

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `
            <div class="page-btn ${activeClass}" onclick="changePage(${i})">
                ${i}
            </div>`;
    }

    // Nút Next 
    if (currentPage < totalPages) {
        html += `
            <div class="page-btn" onclick="changePage(${currentPage + 1})">
                <i class="fa-solid fa-angles-right"></i>
            </div>`;
    }

    pagination.innerHTML = html;
}