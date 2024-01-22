import axios from "axios";

const instance = axios.create({
    baseURL: "https://ecommerce-fwch.onrender.com",
});

export default instance;
