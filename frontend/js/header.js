fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById("header").innerHTML = html;
        updateHoverMenu();

    }
    )
function updateHoverMenu() {
    const accessToken = localStorage.getItem("access_token");
    const authText = document.getElementById("auth-status-text");
    const personLink = document.getElementById("person-link");

    if (accessToken) {
        // TRƯỜNG HỢP: ĐÃ LOGIN
        authText.innerText = "Logout";
        authText.href = "#"; // Tránh chuyển trang khi nhấn vào logout
        authText.classList.add("text-danger"); // Thêm màu đỏ cho nút logout nếu muốn

        // Gán sự kiện click để đăng xuất
        authText.onclick = function (e) {
            e.preventDefault();
            localStorage.clear(); // Xóa sạch token
            alert("Bạn đã đăng xuất!");
            window.location.reload(); // Load lại trang để cập nhật giao diện
        };

    } else {
        authText.innerText = "Login";
        authText.href = "login.html";
        authText.classList.remove("text-danger");

        personLink.href = "login.html";
    }
}

