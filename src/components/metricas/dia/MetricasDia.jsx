import { useState } from "react";
import DatePicker from "react-datepicker";
import { setDefaultLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale';

import "react-datepicker/dist/react-datepicker.css";

import { format } from "date-fns";

import axios from "axios";
import Loader from "../../loader/Loader"
import { GraficoTemp } from "./GraficoTemp";
const api = axios.create()


const MetricasDia = () => {
  const [date, setDate] = useState(null)
  const [dataDay, setDataDay] = useState(false)
  const [maxMin, setMaxMin] = useState(null)

  setDefaultLocale(ptBR)

  const myTz = "America/Sao_Paulo";

  const setTz = (date) => {
    const manipulated = date.toLocaleString("pt-BR", {
      timeZone: myTz,
    })
    return manipulated
  }

  function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  const getDataDay = async (date) => {
    if (!isValidDate(date)) return false
    try {
      const response = await api.get(`https://backend.agudos.net/day/${date}`)
      const data = response.data.data
      const maxMin = response.data.maxMin
      setDataDay(data)
      setMaxMin(maxMin)
      return data
    }
    catch (err) {
      console.error("ops! ocorreu um erro: " + err);
      throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
  }

  const handleChange = (date) => {
    const dateStr = format(date, 'yyy-MM-dd')
    setDate(date)
    getDataDay(dateStr).then(res => {
      setDataDay(res)
    })

  }

  const Container = () => {

    if (!date) {
      return (
        <div className="m-3">Selecione uma data.</div>
      )
    }

    if (!dataDay || !maxMin) {
      return (
        <div className="mt-20 ms-5 flex flex-col">
          <Loader props={"h-12 w-12"}/>
        </div>
      )
    }

    return (
      <div className="mt-20 ms-5 flex flex-col">
        <div>
          Selected date: {date ? date.toLocaleDateString() : "--"}
        </div>
        <div>
          Última leitura: {dataDay ? setTz(dataDay[dataDay.length - 1].data) : "Sem dados"}
        </div>
        <div>
          Chuva: {dataDay && dataDay[dataDay.length - 1].chuva_dia}mm
        </div>
        <div>
          Temp Max: {maxMin && maxMin.maxTemp.value}, Temp Min: {maxMin && maxMin.minTemp.value}
        </div>
        <GraficoTemp dataDay={dataDay}/>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <DatePicker
          selected={date}
          onChange={(date) => handleChange(date)}
          // isClearable
          minDate={new Date("2019-09-01")}
          maxDate={new Date()}
          placeholderText="dd/MM/yyyy"
          // inline={true}
          popperClassName="bg-yellow-200"
          wrapperClassName="bg-transparent"
          showYearDropdown={true}
          // showMonthDropdown={true}
          scrollableYearDropdown={true}
          showIcon
          className="w-auto rounded-xl"
          popperPlacement="end"
        />
        <Container />
        {/* <Loader props={"h-12 w-12"}/> */}
      </div>
    </>
  )
}

export default MetricasDia