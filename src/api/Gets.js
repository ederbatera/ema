import api from "../services/api";

const getMaxMinDay = async () => {

    try {
        const response = await api.get("/max_min_day");
        return response.data;
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
};

const getAllDay = async () => {

    try {
        const response = await api.get("");
        return response.data;
        
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
};

const getDataGraphics = async () => {

    try {
        const response = await api.get("/graphics");
        return response.data;
        
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
};

const getRainSevenDays = async () => {

    try {
        const response = await api.get("/chuva_7_dias");
        return response.data;
        
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
};


const getWeather = async () => {

    try {
        const response = await api.get("/weather");
        return response.data;
        
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
};

export { getMaxMinDay, getAllDay, getDataGraphics, getRainSevenDays, getWeather };







// function toSnakeCase(str) {
//     // return str.replace(/([A-Z])/g, "_$1").toLowerCase();
//     return str.toLowerCase();
// }

// function convertKeysToSnakeCase(obj) {
//     if (Array.isArray(obj)) {
//         return obj.map(v => convertKeysToSnakeCase(v));
//     } else if (obj !== null && obj.constructor === Object) {
//         return Object.keys(obj).reduce((result, key) => {
//             const newKey = toSnakeCase(key);
//             result[newKey] = convertKeysToSnakeCase(obj[key]);
//             return result;
//         }, {});
//     }
//     return obj;
// }