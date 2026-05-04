import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
        withCredentials: true,
});

// Add a request interceptor to include the access token in the Authorization header
api.interceptors.request.use((config) => {
    const {accessToken} = useAuthStore.getState();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
});

api.interceptors.response.use(response => response, async error => {
    const originalRequest = error.config;

    // APIs dont't need to be retried
    if (originalRequest.url.includes("/auth/refresh") 
        || originalRequest.url.includes("/auth/signin")
        || originalRequest.url.includes("/auth/signup")){
        // Do not retry these requests
        return Promise.reject(error);
    }

    originalRequest._retryCount = originalRequest._retryCount || 0;
    if (error.response?.status === 403 && originalRequest._retryCount < 4) {
        originalRequest._retryCount += 1;
        console.log("refresh", originalRequest._retryCount);
        try {
            const res = await api.post("/auth/refresh", {}, {withCredentials: true});
            const newAccessToken = res.data.accessToken;
            useAuthStore.getState().setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        }
        catch (error) {
            useAuthStore.getState().clearState();
            return Promise.reject(error);
        }
    }
    return Promise.reject(error);
});

export default api;