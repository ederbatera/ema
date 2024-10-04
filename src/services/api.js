import axios from "axios";

const api = axios.create({
    baseURL: "https://backend.agudos.net/",
    // baseURL: "http://localhost:3001/",
  })


  export default api;