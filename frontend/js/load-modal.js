async function loadModals() {
    try {
        const response = await fetch('modal.html');
        if (!response.ok) throw new Error("Không thể tải file modal.html");

        const html = await response.text();
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        console.log("Hệ thống Modal đã sẵn sàng");
    } catch (error) {
        console.error("Lỗi khi tải modal:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadModals);