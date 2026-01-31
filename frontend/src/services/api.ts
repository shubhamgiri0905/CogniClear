import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('cogniclear_user');
        if (user) {
            const parsedUser = JSON.parse(user);
            if (parsedUser.token) {
                config.headers.Authorization = `Bearer ${parsedUser.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
