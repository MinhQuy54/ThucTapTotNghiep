document.addEventListener("DOMContentLoaded", () => {
    loadHomepageBanners();
});

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
