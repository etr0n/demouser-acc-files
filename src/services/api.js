import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    auth: {
        username: import.meta.env.VITE_API_USERNAME,
        password: import.meta.env.VITE_API_PASSWORD,
    },
})

export default api
