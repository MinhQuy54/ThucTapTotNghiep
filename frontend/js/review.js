// review.js - Quản lý bình luận trang product-details.html
(function () {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) return;

    document.addEventListener('DOMContentLoaded', () => {
        loadReviews();
        initReviewForm();
    });

    // Render sao từ điểm số
    function renderStars(rating, filled = true) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fa-solid fa-star text-warning"></i>';
            } else {
                stars += '<i class="fa-regular fa-star text-warning"></i>';
            }
        }
        return stars;
    }

    // Hiển thị tổng quan rating
    function renderSummary(avg, total) {
        const avgEl = document.getElementById('avg-rating');
        const starAvgEl = document.getElementById('star-avg');
        const totalEl = document.getElementById('total-reviews');
        if (avgEl) avgEl.textContent = avg > 0 ? avg.toFixed(1) : '—';
        if (starAvgEl) starAvgEl.innerHTML = renderStars(Math.round(avg));
        if (totalEl) totalEl.textContent = `${total} đánh giá`;
    }

    // Load danh sách reviews
    async function loadReviews() {
        const reviewList = document.getElementById('review-list');
        if (!reviewList) return;

        try {
            const res = await fetch(`/api/review/${productId}`);
            const data = await res.json();

            renderSummary(data.avgRating || 0, data.total || 0);

            const reviews = data.data || [];
            if (reviews.length === 0) {
                reviewList.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="fa-regular fa-comment-dots fa-3x mb-3 opacity-50"></i>
                        <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                    </div>`;
                return;
            }

            const currentUserId = getCurrentUserId();

            reviewList.innerHTML = reviews.map(r => {
                const date = new Date(r.createdAt).toLocaleDateString('vi-VN');
                const avatar = r.user?.avatar
                    ? (r.user.avatar.startsWith('/media') ? r.user.avatar : `/media/${r.user.avatar}`)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.username || 'U')}&background=78a206&color=fff&size=40`;
                const isOwner = currentUserId && String(r.user?.id) === String(currentUserId);

                return `
                    <div class="review-card" id="review-item-${r.id}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <img src="${avatar}" alt="avatar"
                                    class="rounded-circle" style="width:36px;height:36px;object-fit:cover;"
                                    onerror="this.src='https://ui-avatars.com/api/?name=U&background=78a206&color=fff&size=40'">
                                <div>
                                    <span class="fw-bold small">${r.user?.username || 'Ẩn danh'}</span>
                                    <div>${renderStars(r.rating)}</div>
                                </div>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="text-muted" style="font-size:0.75rem;">${date}</span>
                                ${isOwner ? `<button class="btn btn-sm text-danger p-0 border-0 bg-transparent" onclick="deleteReview(${r.id})" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                            </div>
                        </div>
                        <p class="mb-0 mt-2 text-dark" style="line-height:1.6;">${escapeHtml(r.comment)}</p>
                    </div>`;
            }).join('');

        } catch (e) {
            console.error('Lỗi tải review:', e);
            document.getElementById('review-list').innerHTML =
                '<p class="text-danger small">Không thể tải đánh giá.</p>';
        }
    }

    // Khởi tạo form đánh giá
    function initReviewForm() {
        const token = localStorage.getItem('access_token');
        const formContainer = document.getElementById('review-form-container');
        const loginPrompt = document.getElementById('review-login-prompt');

        if (token) {
            if (formContainer) formContainer.style.display = 'block';
            if (loginPrompt) loginPrompt.style.display = 'none';
            // Check xem user có mua sản phẩm không
            checkUserPurchased();
        } else {
            if (formContainer) formContainer.style.display = 'none';
            if (loginPrompt) loginPrompt.style.display = 'block';
        }

        // Star picker
        const stars = document.querySelectorAll('.star-pick');
        stars.forEach(star => {
            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.dataset.val);
                stars.forEach(s => {
                    const sv = parseInt(s.dataset.val);
                    s.className = sv <= val
                        ? 'fa-solid fa-star star-pick text-warning'
                        : 'fa-regular fa-star star-pick text-warning';
                });
            });
            star.addEventListener('mouseleave', () => {
                const selected = parseInt(document.getElementById('selected-rating').value) || 0;
                stars.forEach(s => {
                    const sv = parseInt(s.dataset.val);
                    s.className = sv <= selected
                        ? 'fa-solid fa-star star-pick text-warning'
                        : 'fa-regular fa-star star-pick text-warning';
                });
            });
            star.addEventListener('click', () => {
                const val = star.dataset.val;
                document.getElementById('selected-rating').value = val;
            });
        });

        // Submit
        const btnSubmit = document.getElementById('btn-submit-review');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', submitReview);
        }
    }

    // Check xem user có mua sản phẩm này không
    async function checkUserPurchased() {
        try {
            const res = await fetchWithAuth(`/api/order/`);
            const orders = await res.json();

            if (!orders || !Array.isArray(orders)) {
                return;
            }

            const validOrders = orders.filter(order => order.status >= 1 && order.status !== 5);
            let hasPurchased = false;

            if (validOrders.length > 0) {
                for (const order of validOrders) {
                    try {
                        const detailRes = await fetchWithAuth(`/api/order/detail/${order.id}/`);
                        
                        if (!detailRes.ok) {
                            continue;
                        }
                        
                        const orderDetail = await detailRes.json();
                        const itemsArray = orderDetail.order_items || orderDetail.items || orderDetail.orderItems;
                        
                        if (!itemsArray) {
                            continue;
                        }

                        const isFound = itemsArray.some(item => {
                            const pid = item.product_id || item.productId || (item.product && item.product.id);
                            return String(pid) === String(productId);
                        });

                        if (isFound) {
                            hasPurchased = true;
                            break;
                        }
                    } catch (err) {
                        console.error(`Lỗi khi lấy chi tiết đơn ${order.id}:`, err);
                    }
                }
            }
            
            // Xử lý hiển thị Form
            const formContainer = document.getElementById('review-form-container');
            const notPurchasedMsg = document.getElementById('review-not-purchased');
            
            if (!hasPurchased) {
                if (formContainer) formContainer.style.display = 'none';
                if (notPurchasedMsg) {
                    notPurchasedMsg.style.display = 'block';
                } else {
                    const msgDiv = document.createElement('div');
                    msgDiv.id = 'review-not-purchased';
                    msgDiv.className = 'alert alert-info mt-3';
                    msgDiv.innerHTML = '<i class="fa-solid fa-info-circle me-2"></i>Bạn chỉ có thể đánh giá sản phẩm mà bạn đã mua (và đơn hàng đã được xác nhận/thanh toán).';
                    if (formContainer) formContainer.parentNode.insertBefore(msgDiv, formContainer);
                }
            } else {
                if (formContainer) formContainer.style.display = 'block';
                if (notPurchasedMsg) notPurchasedMsg.style.display = 'none';
            }
        } catch (e) {
            console.error('Lỗi nghiêm trọng:', e);
        }
    }

    // Gửi review
    async function submitReview() {
        const rating = parseInt(document.getElementById('selected-rating').value) || 0;
        const comment = document.getElementById('review-comment').value.trim();
        const msgEl = document.getElementById('review-form-msg');
        const btn = document.getElementById('btn-submit-review');

        if (rating === 0) {
            msgEl.innerHTML = '<span class="text-danger">Vui lòng chọn số sao.</span>';
            return;
        }
        if (!comment) {
            msgEl.innerHTML = '<span class="text-danger">Vui lòng nhập nội dung đánh giá.</span>';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang gửi...';
        msgEl.innerHTML = '';

        try {
            const res = await fetchWithAuth('/api/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: parseInt(productId), rating, comment })
            });

            const data = await res.json();

            if (res.ok) {
                msgEl.innerHTML = '<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>Đánh giá thành công!</span>';
                document.getElementById('review-comment').value = '';
                document.getElementById('selected-rating').value = '0';
                document.querySelectorAll('.star-pick').forEach(s => {
                    s.className = 'fa-regular fa-star star-pick text-warning';
                });
                // Reload danh sách
                await loadReviews();
            } else {
                // Xử lý các lỗi khác nhau
                const errorMsg = data.message || 'Có lỗi xảy ra.';
                if (errorMsg.includes('mua')) {
                    msgEl.innerHTML = `<span class="text-danger"><i class="fa-solid fa-ban me-1"></i>${errorMsg}</span>`;
                } else if (errorMsg.includes('đánh giá')) {
                    msgEl.innerHTML = `<span class="text-warning"><i class="fa-solid fa-exclamation-triangle me-1"></i>${errorMsg}</span>`;
                } else {
                    msgEl.innerHTML = `<span class="text-danger">${errorMsg}</span>`;
                }
            }
        } catch (e) {
            msgEl.innerHTML = '<span class="text-danger">Không thể kết nối máy chủ.</span>';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane me-1"></i>Gửi đánh giá';
        }
    }

    // Xóa review
    window.deleteReview = async function (reviewId) {
        if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
        try {
            const res = await fetchWithAuth(`/api/review/${reviewId}`, { method: 'DELETE' });
            if (res.ok) {
                document.getElementById(`review-item-${reviewId}`)?.remove();
                await loadReviews();
            } else {
                const d = await res.json();
                alert(d.message || 'Xóa thất bại.');
            }
        } catch {
            alert('Lỗi kết nối.');
        }
    };

    // Helper lấy userId từ JWT
    function getCurrentUserId() {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user_id || payload.sub || null;
        } catch { return null; }
    }

    // Escape HTML để tránh XSS
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }
})();
