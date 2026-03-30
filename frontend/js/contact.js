
document.getElementById('contact-form').addEventListener("submit", sendContact);

async function sendContact(e) {
    e.preventDefault();
    const payload = {
        full_name: document.getElementById('contact-fullname').value,
        email: document.getElementById('contact-email').value,
        phone_number: document.getElementById('contact-phone').value,
        message: document.getElementById('contact-message').value,
    }
    try {
        const res = await fetch(`/api/contact/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            antd.notification.success({
                message: "Thành công",
                description: "Đã gửi liên hệ"
            });

            document.getElementById("contact-form").reset();
        }
        else {
            antd.notification.error({
                message: "Lỗi",
                description: JSON.stringify(data)
            });
        }
    } catch { }
}