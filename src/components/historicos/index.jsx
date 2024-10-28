import { useEffect, useState } from "react";
import axios from "axios";
const api = axios.create()

import { Chuvas } from "./Chuvas";

const getDadosHistoricos = async () => {

  try {
    const response = await api.get("https://backend.agudos.net/dados-historicos")
    const data = response.data
    return data;
  }
  catch (err) {
    console.error("ops! ocorreu um erro: " + err);
    throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
  }
}

const Historicos = () => {

  const [historico, setHistorico] = useState(null)

  useEffect(() => {
    getDadosHistoricos()
      .then((data) => {
        setHistorico(data)
      })
      .catch((error) => {
        console.error('Erro ao obter previsão:', error)
      });
  }, []);

  return (
    <>
      <div>Historicos</div>
      {
        historico &&
        <Chuvas
          years={historico} 
          
          />
      }
    </>
  )
}

export default Historicos