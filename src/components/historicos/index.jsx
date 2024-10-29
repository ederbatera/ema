import { useEffect, useState } from "react";
import axios from "axios";
const api = axios.create()

import { Chuvas } from "./Chuvas";
import { MediaTemperatura } from "./MediaTemperatura";

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
    <div className="bg-blue-gray-100 
                    dark:bg-black dark:bg-opacity-5">
      <div className="flex flex-col mx-auto text-center mb-2
      text-gray-800 dark:text-blue-gray-300">
        <div className="text-lg">Dados Históricos</div>
        <div className="text-xs">Desde Agosto de 2019.</div>
      </div>

      {
        historico ?
          (
            <>
              <Chuvas years={historico} />
              <MediaTemperatura years={historico} />
              <div className="py-3"></div>
            </>
          )
          :
          (
            <div>Carregando...</div>
          )
      }
    </div>
  )
}

export default Historicos