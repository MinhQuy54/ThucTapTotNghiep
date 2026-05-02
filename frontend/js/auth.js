let refreshTokenRequest = null;

function clearAuthTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
        clearAuthTokens();
        throw new Error("Missing refresh token");
    }

    if (!refreshTokenRequest) {
        refreshTokenRequest = fetch("/api/token/refresh/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refresh: refreshToken })
        })
            .then(async (response) => {
                if (!response.ok) {
                    clearAuthTokens();
                    throw new Error("Refresh token expired or invalid");
                }

                const data = await response.json();
                localStorage.setItem("access_token", data.access);

                if (data.refresh) {
                    localStorage.setItem("refresh_token", data.refresh);
                }

                return data.access;
            })
            .finally(() => {
                refreshTokenRequest = null;
            });
    }

    return refreshTokenRequest;
}

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access_token"); 

    const headers = {
        ...options.headers,
        "Authorization": token ? `Bearer ${token}` : ""
    };

    const fetchOptions = {
        ...options,
        headers: headers
    };

    try {
        let response = await fetch(url, fetchOptions);

        if (response.status === 401) {
            const newAccessToken = await refreshAccessToken();
            response = await fetch(url, {
                ...fetchOptions,
                headers: {
                    ...headers,
                    "Authorization": `Bearer ${newAccessToken}`
                }
            });
        }

        return response; 
        
    } catch (error) {
        console.error("Lỗi Fetch:", error);
        throw error;
    }
}
