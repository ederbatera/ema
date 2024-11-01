import { useEffect, useState } from "react";
import axios from "axios";
const api = axios.create()

import { Table } from "./Table";
import Loader from "../loader/Loader";

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
              <Table years={historico} title={"Precipitacao."} arr={"chuva"} />

              <Table years={historico} title={"Temperatura média."} arr={"temp_media"} />
              <Table years={historico} title={"Temperatura mínima (extrema)."} arr={"temp_min"} />
              <Table years={historico} title={"Temperatura máxima (extrema)."} arr={"temp_max"} />
              <Table years={historico} title={"Média das temperaturas mínimas."} arr={"temp_media_min"} />
              <Table years={historico} title={"Média das temperaturas máximas."} arr={"temp_media_max"} />

              <Table years={historico} title={"Umidade média."} arr={"umi_media"} />
              <Table years={historico} title={"Média das umidades mínimas."} arr={"umi_media_min"} />
              <Table years={historico} title={"Média das umidades máximas."} arr={"umi_media_max"} />

              <div className="py-3"></div>
            </>
          )
          :
          (
            <div className="mt-10 place-items-center">
              <Loader props={"h-15 w-15"} />
            </div>
          )
      }
    </div>
  )
}

export default Historicos