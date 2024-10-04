import { useContext } from "react"
import { GlobalContext } from "@/context/GlobalContext"


export const  useGraficos = () => {
    const { dataGraphics, maxMinDay } = useContext(GlobalContext)
    const dataGrafico = dataGraphics.map(item => ({
      data: item.data,
      Temperatura: item.temp_atual,
      Umidade: item.umi_atual,
      Pressão: item.p_atm,
      Chuva: item.chuva_5min
  }));
return {
  dataGrafico,
  maxMinDay
}
}