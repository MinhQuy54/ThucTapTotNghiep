async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('access_token'); 

    const headers = {
        ...options.headers,
        "Authorization": token ? `Bearer ${token}` : ""
    };

    const fetchOptions = {
        ...options,
        headers: headers
    };

    try {
        const response = await fetch(url, fetchOptions);

        if (response.status === 401) {
            console.error("Lỗi 401: Backend không chấp nhận Token này.");
            throw new Error('Unauthorized');
        }

        return response; 
        
    } catch (error) {
        console.error("Lỗi Fetch:", error);
        throw error;
    }
}