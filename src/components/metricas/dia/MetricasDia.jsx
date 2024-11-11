import { useState } from "react";
import DatePicker from "react-datepicker";
import { setDefaultLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale';

import "react-datepicker/dist/react-datepicker.css";

import { format, min } from "date-fns";

import axios from "axios";
import Loader2 from "../../loader/Loader2";
import { Grafico } from "./Grafico";

import { FaCloudRain } from "react-icons/fa";
import { Droplets, Wind, Thermometer, CircleGauge, MousePointer, ClockArrowUp, ClockArrowDown } from 'lucide-react';


const api = axios.create()


const MetricasDia = () => {
  const [date, setDate] = useState(null)
  const [dataDay, setDataDay] = useState(false)
  const [maxMin, setMaxMin] = useState(null)

  setDefaultLocale(ptBR)

  const dateFormatTz = (date) => {
    const options = {
      // weekday: "long",
      // year: "numeric",
      // month: "long",
      // day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }
    const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", options)
    return dateTimeFormat.format(new Date(date))

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
        <div className="mt-3 place-items-center">
          <div className="text-2xl font-serif text-gray-800 dark:text-blue-gray-200">Selecione uma data.</div>
        </div>
      )
    }

    if (!dataDay || !maxMin) {
      return (
        <div className="mt-5 place-items-center">
          {/* <Loader props={"h-15 w-15"} /> */}
          <Loader2 />
        </div>
      )
    }

    const rain = dataDay[dataDay.length - 1].chuva_dia > 0

    return (
      <section className="place-items-center mt-3">

        <div className="flex flex-wrap gap-y-3 mb-6 w-full max-w-screen-xl justify-between">

          <div className="flex flex-col items-center rounded-xl md:min-w-[10rem] place-items-center min-w-full
                          dark:bg-black shadow-lg shadow-gray-800 text-gray-800 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
            <div className="bg-blue-gray-300 dark:bg-blue-gray-700 bg-opacity-90 w-full rounded-ss-xl rounded-se-xl p-3">
              <svg className="mx-auto" width="23" height="23" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 1C4.77614 1 5 1.22386 5 1.5V2H10V1.5C10 1.22386 10.2239 1 10.5 1C10.7761 1 11 1.22386 11 1.5V2H12.5C13.3284 2 14 2.67157 14 3.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V3.5C1 2.67157 1.67157 2 2.5 2H4V1.5C4 1.22386 4.22386 1 4.5 1ZM10 3V3.5C10 3.77614 10.2239 4 10.5 4C10.7761 4 11 3.77614 11 3.5V3H12.5C12.7761 3 13 3.22386 13 3.5V5H2V3.5C2 3.22386 2.22386 3 2.5 3H4V3.5C4 3.77614 4.22386 4 4.5 4C4.77614 4 5 3.77614 5 3.5V3H10ZM2 6V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V6H2ZM7 7.5C7 7.22386 7.22386 7 7.5 7C7.77614 7 8 7.22386 8 7.5C8 7.77614 7.77614 8 7.5 8C7.22386 8 7 7.77614 7 7.5ZM9.5 7C9.22386 7 9 7.22386 9 7.5C9 7.77614 9.22386 8 9.5 8C9.77614 8 10 7.77614 10 7.5C10 7.22386 9.77614 7 9.5 7ZM11 7.5C11 7.22386 11.2239 7 11.5 7C11.7761 7 12 7.22386 12 7.5C12 7.77614 11.7761 8 11.5 8C11.2239 8 11 7.77614 11 7.5ZM11.5 9C11.2239 9 11 9.22386 11 9.5C11 9.77614 11.2239 10 11.5 10C11.7761 10 12 9.77614 12 9.5C12 9.22386 11.7761 9 11.5 9ZM9 9.5C9 9.22386 9.22386 9 9.5 9C9.77614 9 10 9.22386 10 9.5C10 9.77614 9.77614 10 9.5 10C9.22386 10 9 9.77614 9 9.5ZM7.5 9C7.22386 9 7 9.22386 7 9.5C7 9.77614 7.22386 10 7.5 10C7.77614 10 8 9.77614 8 9.5C8 9.22386 7.77614 9 7.5 9ZM5 9.5C5 9.22386 5.22386 9 5.5 9C5.77614 9 6 9.22386 6 9.5C6 9.77614 5.77614 10 5.5 10C5.22386 10 5 9.77614 5 9.5ZM3.5 9C3.22386 9 3 9.22386 3 9.5C3 9.77614 3.22386 10 3.5 10C3.77614 10 4 9.77614 4 9.5C4 9.22386 3.77614 9 3.5 9ZM3 11.5C3 11.2239 3.22386 11 3.5 11C3.77614 11 4 11.2239 4 11.5C4 11.7761 3.77614 12 3.5 12C3.22386 12 3 11.7761 3 11.5ZM5.5 11C5.22386 11 5 11.2239 5 11.5C5 11.7761 5.22386 12 5.5 12C5.77614 12 6 11.7761 6 11.5C6 11.2239 5.77614 11 5.5 11ZM7 11.5C7 11.2239 7.22386 11 7.5 11C7.77614 11 8 11.2239 8 11.5C8 11.7761 7.77614 12 7.5 12C7.22386 12 7 11.7761 7 11.5ZM9.5 11C9.22386 11 9 11.2239 9 11.5C9 11.7761 9.22386 12 9.5 12C9.77614 12 10 11.7761 10 11.5C10 11.2239 9.77614 11 9.5 11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </div>
            <div className="my-auto p-5">
              <div className="flex gap-x-1 items-center my-auto 
                            dark:bg-black dark:text-blue-gray-200">
                <div className="font-semibold">
                  {date ? date.toLocaleDateString() : "--"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-xl md:min-w-[10rem] place-items-center min-w-full
                          dark:bg-black shadow-lg shadow-gray-800 text-gray-800 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
            <div className="bg-blue-gray-300 dark:bg-blue-gray-700 bg-opacity-90 w-full rounded-ss-xl rounded-se-xl p-3">
              <FaCloudRain className="mx-auto" size={23} />
            </div>
            <div className="my-auto p-5">
              <div className="flex gap-x-1 items-center my-auto">
                <div className="font-semibold">
                  {`${dataDay[dataDay.length - 1].chuva_dia} mm`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-xl md:min-w-[10rem] place-items-center min-w-full
                          dark:bg-black shadow-lg shadow-gray-800 text-gray-800 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
            <div className="bg-blue-gray-300 dark:bg-blue-gray-700 bg-opacity-90 w-full rounded-ss-xl rounded-se-xl p-3">
              <Thermometer className="mx-auto" size={23} />
            </div>
            <div className="my-auto p-5">
              <div className="flex gap-x-1 items-center">
                <ClockArrowUp size={20} />
                <div className="font-semibold">{`${maxMin.maxTemp.value}ºC`}</div>
                <div>~</div>
                <div className="font-semibold">{`${dateFormatTz(maxMin.maxTemp.date)}h`}</div>
              </div>
              <div className="flex gap-x-1 items-center">
                <ClockArrowDown size={20} />
                <div className="font-semibold">{`${maxMin.minTemp.value}ºC`}</div>
                <div>~</div>
                <div className="font-semibold">{`${format(maxMin.minTemp.date, "hh:mm")}h`}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-xl md:min-w-[10rem] place-items-center min-w-full
                          dark:bg-black shadow-lg shadow-gray-800 text-gray-800 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
            <div className="bg-blue-gray-300 dark:bg-blue-gray-700 bg-opacity-90 w-full rounded-ss-xl rounded-se-xl p-3">
              <Droplets className="mx-auto" size={23} />
            </div>
            <div className="my-auto p-5">
              <div className="flex gap-x-1 items-center my-auto">
                <ClockArrowUp size={20} />
                <div className="font-semibold">{`${maxMin.maxUmi.value}%`}</div>
                <div>~</div>
                <div className="font-semibold">{`${format(maxMin.maxUmi.date, "hh:mm")}h`}</div>
              </div>
              <div className="flex gap-x-1 items-center my-auto">
                <ClockArrowDown size={20} />
                <div className="font-semibold">{`${maxMin.minUmi.value}%`}</div>
                <div>~</div>
                <div className="font-semibold">{`${format(maxMin.minUmi.date, "hh:mm")}h`}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-xl md:min-w-[10rem] place-items-center min-w-full
                          dark:bg-black shadow-lg shadow-gray-800 text-gray-800 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
            <div className="bg-blue-gray-300 dark:bg-blue-gray-700 bg-opacity-90 w-full rounded-ss-xl rounded-se-xl p-3">
              <CircleGauge className="mx-auto" size={23} />
            </div>
            <div className="my-auto p-5">
              <div className="flex gap-x-1 items-center my-auto">
                <ClockArrowUp size={20} />
                <div className="font-semibold">{`${maxMin.maxPress.value}HPa`}</div>
                <div>~</div>
                <div className="font-semibold">{`${format(maxMin.maxPress.date, "hh:mm")}h`}</div>
              </div>
              <div className="flex gap-x-1 items-center my-auto">
                <ClockArrowDown size={20} />
                <div className="font-semibold">{`${maxMin.minPress.value}HPa`}</div>
                <div>~</div>
                <div className="font-semibold">{`${format(maxMin.minPress.date, "hh:mm")}h`}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center rounded-xl md:min-w-[10rem] place-items-center min-w-full
                          dark:bg-black shadow-lg shadow-gray-800 text-gray-800 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
            <div className="bg-blue-gray-300 dark:bg-blue-gray-700 bg-opacity-90 w-full rounded-ss-xl rounded-se-xl p-3">
              <Wind className="mx-auto" size={23} />
            </div>
            <div className="my-auto p-5">
              <div className="flex gap-x-1 items-center my-auto">
                <ClockArrowUp size={20} />
                <div className="font-semibold">{`${maxMin.maxWind.raj} Km/h `}{maxMin.maxWind.dir_raj}</div>
                <div>~</div>
                <div className="font-semibold">{`${maxMin.maxWind.qtr_raj}h`}</div>
              </div>
            </div>
          </div>

        </div>

        {rain && <Grafico dataDay={dataDay} label={"Chuva"} />}
        <Grafico dataDay={dataDay} label={"Temperatura"} maxMin={maxMin}/>
        <Grafico dataDay={dataDay} label={"Umidade"} maxMin={maxMin}/>
        <Grafico dataDay={dataDay} label={"Pressão"} maxMin={maxMin}/>
      </section>
    )
  }

  return (
    <>
      <section className="flex justify-center">
        <DatePicker
          selected={date}
          onChange={(date) => handleChange(date)}
          // isClearable
          minDate={new Date("2019-09-01")}
          maxDate={new Date()}
          placeholderText="dd/MM/yyyy"
          inline={true}
          popperClassName="bg-yellow-200"
          wrapperClassName="bg-transparent"
          showYearDropdown={true}
          // showMonthDropdown={true}
          scrollableYearDropdown={true}
          showIcon
          className="w-auto rounded-xl"
          popperPlacement="end"
        />
      </section>
      <Container />
    </>
  )
}

export default MetricasDia