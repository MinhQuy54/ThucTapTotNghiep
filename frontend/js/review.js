// review.js - Quản lý bình luận trang product-details.html
(function () {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) return;

    document.addEventListener('DOMContentLoaded', () => {
        loadReviews();
        initReviewForm();
        initFilters();
    });

    let allReviews = [];
    let currentRatingFilter = 0;

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
            const res = await fetch(`/api/v2/reviews/${productId}/`);
            const reviews = await res.json();

            // Tính toán summary từ dữ liệu Django
            const total = reviews.length;
            const avgRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;

            renderSummary(avgRating, total);

            allReviews = reviews || [];
            updateFilterCounts(allReviews);

            const filterContainer = document.getElementById('review-filters');
            if (filterContainer) {
                if (allReviews.length > 0) {
                    filterContainer.style.setProperty('display', 'flex', 'important');
                } else {
                    filterContainer.style.setProperty('display', 'none', 'important');
                }
            }

            renderReviewsList();
        } catch (e) {
            console.error('Lỗi tải review:', e);
            document.getElementById('review-list').innerHTML =
                '<p class="text-danger small">Không thể tải đánh giá.</p>';
        }
    }

    function updateFilterCounts(reviews) {
        let counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => counts[r.rating] = (counts[r.rating] || 0) + 1);
        for (let i = 1; i <= 5; i++) {
            const el = document.getElementById(`count-${i}`);
            if (el) el.textContent = counts[i];
        }
    }

    function renderReviewsList() {
        const reviewList = document.getElementById('review-list');
        if (!reviewList) return;

        if (allReviews.length === 0) {
            reviewList.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fa-regular fa-comment-dots fa-3x mb-3 opacity-50"></i>
                    <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                </div>`;
            return;
        }

        const filteredReviews = currentRatingFilter === 0 ? allReviews : allReviews.filter(r => r.rating === currentRatingFilter);

        if (filteredReviews.length === 0) {
            reviewList.innerHTML = `<div class="text-center py-4 text-muted">Không có đánh giá nào phù hợp với bộ lọc.</div>`;
            return;
        }

        const currentUserId = getCurrentUserId();

        reviewList.innerHTML = filteredReviews.map(r => {
            const date = new Date(r.createdAt).toLocaleDateString('vi-VN');
            const avatar = r.user?.avatar
                ? (r.user.avatar.startsWith('/media') ? r.user.avatar : `/media/${r.user.avatar}`)
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(r.user?.username || 'U')}&background=78a206&color=fff&size=40`;
            const isOwner = currentUserId && String(r.user?.id) === String(currentUserId);

            const escapedComment = escapeHtml(r.comment).replace(/'/g, "\\'").replace(/\n/g, '\\n');

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
                            ${isOwner ? `<button class="btn btn-sm text-primary p-0 border-0 bg-transparent me-2" onclick="editReview(${r.id}, ${r.rating}, '${escapedComment}')" title="Sửa"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm text-danger p-0 border-0 bg-transparent" onclick="deleteReview(${r.id})" title="Xóa"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                        </div>
                    </div>
                    <p class="mb-0 mt-2 text-dark" style="line-height:1.6;">${escapeHtml(r.comment)}</p>
                    
                    ${r.reply_content ? `
                    <div class="staff-reply mt-3 p-3 bg-light rounded-3 border-start border-primary border-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-primary">Phản hồi từ Nhân Viên</span>
                            <span class="text-muted small">${new Date(r.replied_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p class="mb-0 text-dark small" style="font-style: italic;">${escapeHtml(r.reply_content)}</p>
                    </div>
                    ` : ''}
                </div>`;
        }).join('');
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

                stars.forEach(s => {
                    const sv = parseInt(s.dataset.val);
                    s.className = sv <= val
                        ? 'fa-solid fa-star star-pick text-warning'
                        : 'fa-regular fa-star star-pick text-warning';
                });
            });
        });

        // Submit & Cancel
        const btnSubmit = document.getElementById('btn-submit-review');
        if (btnSubmit) {
            btnSubmit.addEventListener('click', submitReview);
        }

        const btnCancel = document.getElementById('btn-cancel-edit');
        if (btnCancel) {
            btnCancel.addEventListener('click', cancelEdit);
        }
    }

    function initFilters() {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => {
                    b.classList.remove('btn-success');
                    b.classList.add('btn-outline-success');
                });
                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-success');
                currentRatingFilter = parseInt(btn.dataset.rating);
                renderReviewsList();
            });
        });
    }

    window.editReview = function (reviewId, rating, comment) {
        // Remove line breaks if stored as <br> (already handled by escapeHtml reversal if needed)
        // But comment here is passed directly. Replace escaped newlines back.
        document.getElementById('editing-review-id').value = reviewId;
        document.getElementById('review-form-title').textContent = 'Sửa đánh giá của bạn';

        // Cập nhật rating
        document.getElementById('selected-rating').value = rating;
        const stars = document.querySelectorAll('.star-pick');
        stars.forEach(s => {
            const sv = parseInt(s.dataset.val);
            s.className = sv <= rating
                ? 'fa-solid fa-star star-pick text-warning'
                : 'fa-regular fa-star star-pick text-warning';
        });

        // Cập nhật comment (khôi phục \n từ escapeHtml nếu có)
        // Khi render ra string HTML ta đã escapeHtml(r.comment), lúc truyền vào nó là string.
        // Replace <br> back to \n
        document.getElementById('review-comment').value = comment.replace(/<br>/g, '\n').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");

        document.getElementById('btn-submit-review').innerHTML = '<i class="fa-solid fa-save me-1"></i>Lưu thay đổi';
        document.getElementById('btn-cancel-edit').style.display = 'block';

        // Cuộn tới form
        document.getElementById('review-form-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function cancelEdit() {
        document.getElementById('editing-review-id').value = '';
        document.getElementById('review-form-title').textContent = 'Viết đánh giá của bạn';
        document.getElementById('selected-rating').value = '0';
        const stars = document.querySelectorAll('.star-pick');
        stars.forEach(s => s.className = 'fa-regular fa-star star-pick text-warning');
        document.getElementById('review-comment').value = '';

        document.getElementById('btn-submit-review').innerHTML = '<i class="fa-solid fa-paper-plane me-1"></i>Gửi đánh giá';
        document.getElementById('btn-cancel-edit').style.display = 'none';
        document.getElementById('review-form-msg').innerHTML = '';
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

    // Gửi review (Thêm mới hoặc Cập nhật)
    async function submitReview() {
        const rating = parseInt(document.getElementById('selected-rating').value) || 0;
        const comment = document.getElementById('review-comment').value.trim();
        const msgEl = document.getElementById('review-form-msg');
        const btn = document.getElementById('btn-submit-review');
        const editingId = document.getElementById('editing-review-id').value;

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
            const isEdit = editingId !== '';
            const url = isEdit ? `/api/review/${editingId}` : '/api/review';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                productId: parseInt(productId),
                rating,
                comment
            };

            const res = await fetchWithAuth(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                msgEl.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check me-1"></i>${isEdit ? 'Đã lưu thay đổi!' : 'Đánh giá thành công!'}</span>`;
                cancelEdit(); // clear form
                await loadReviews();
            } else {
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
            const isEdit = document.getElementById('editing-review-id').value !== '';
            btn.innerHTML = isEdit ? '<i class="fa-solid fa-save me-1"></i>Lưu thay đổi' : '<i class="fa-solid fa-paper-plane me-1"></i>Gửi đánh giá';
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
