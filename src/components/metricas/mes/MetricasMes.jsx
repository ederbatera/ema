
import { useState } from "react";
import DatePicker from "react-datepicker";
import { setDefaultLocale } from "react-datepicker";
import { ptBR } from 'date-fns/locale';

import "react-datepicker/dist/react-datepicker.css";
import {
  Card,
  CardHeader,
  Input,
  Typography,
  Button,
  CardBody,
  Chip,
  CardFooter,
  Tabs,
  TabsHeader,
  Tab,
  Avatar,
  IconButton,
  Tooltip,
} from "@material-tailwind/react";

import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/24/outline";
import { PencilIcon, UserPlusIcon } from "@heroicons/react/24/solid";


import { format } from "date-fns";

import axios from "axios";
import Loader2 from "../../loader/Loader2";
// import { Grafico } from "./Grafico";

import { FaCloudRain } from "react-icons/fa";
import { Droplets, Wind, Thermometer, ClockArrowUp, ClockArrowDown } from 'lucide-react';
import { TableDaysMonth } from "./TableDaysMonth";


const api = axios.create()


const MetricasMes = () => {
  const [date, setDate] = useState(null)
  const [dataDay, setDataDay] = useState(false)
  const [dadosDiarios, setDadosDiarios] = useState(null)

  setDefaultLocale(ptBR)

  const dateFormatTz = (date) => {
    const options = {
      // weekday: "long",
      // year: "numeric",
      month: "long",
      // day: "numeric",
      // hour: "numeric",
      // minute: "numeric",
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
    const [ano, mes] = date.split("-")
    try {
      const response = await api.get(`https://backend.agudos.net/metricas-mes/?mes=${mes}&ano=${ano}`)
      return response.data
    }
    catch (err) {
      console.error("ops! ocorreu um erro: " + err);
      throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
  }

  const handleChange = (date) => {
    const dateStr = format(date, 'yyy-MM')
    setDate(date)
    setDataDay(false)
    setDadosDiarios(null)
    getDataDay(dateStr).then(data => {
      const { dadosDiarios } = data
      setDadosDiarios(dadosDiarios)
      setDataDay(data)
    })

  }

  const Container = () => {

    if (!date) {
      return (
        <div className="mt-3 place-items-center">
          <div className="text-2xl font-serif text-gray-800 dark:text-blue-gray-200">Selecione um mês.</div>
        </div>
      )
    }

    if (!dataDay || !dadosDiarios) {
      return (
        <div className="place-items-center">
          <Loader2 />
        </div>
      )
    }

    // const rain = dataDay[dataDay.length - 1].chuva_dia > 0

    const TableTemp = () => {
      const TABLE_HEAD = ["Temp Máxima", "Temp Mínima", "Temp Média", "Temp Média Mínima", "Temp Média Máxima"]
      const TABLE_ROWS = [
        {
          tempMax: dataDay.tempMax,
          tempMin: dataDay.tempMin,
          mediaTemp: dataDay.mediaTemp,
          mediaTempMax: dataDay.mediaTempMax,
          mediaTempMin: dataDay.mediaTempMin
        }
      ]

      return (
        <section
          className='w-full md:max-w-screen-xl place-items-center mx-10 xl:mx-0 md:mx-0'
        >
          <Card
            variant="gradient"
            className="shadow-xl place-items-center shadow-gray-800 p-6 min-w-full
          bg-gray-300 text-gray-800
          dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900"
          >
            <Typography
              className="font-bold mt-3 w-80 text-gray-400 dark:text-gray-800 md:w-full text-center"
            >
              Temperatura
            </Typography>
            <table className="w-full min-w-min table-auto text-center text-xs">
              <thead>
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th key={head} className="border-b border-gray-300 pb-4 pt-10">
                      <Typography
                        variant="small"
                        // color="blue-gray"
                        className="font-bold leading-none "
                      >
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(({ tempMax, tempMin, mediaTemp, mediaTempMax, mediaTempMin }, index) => {
                  const isLast = index === TABLE_ROWS.length - 1;
                  const classes = isLast ? "py-4" : "py-4 border-b border-gray-300";

                  return (
                    <tr key={tempMax} className="">
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {tempMax}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {tempMin}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {mediaTemp.toFixed(2)}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {mediaTempMax.toFixed(2)}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {mediaTempMin.toFixed(2)}
                        </Typography>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>
      )

    }
    const TableUmi = () => {
      const TABLE_HEAD = ["Chuva Acumulada", "Umidade Média", "Umidade Média Mímima", "Umidade Média Máxima"];
      const TABLE_ROWS = [
        {
          chuva: 50,
          mediaUmidade: dataDay.mediaUmidade,
          mediaUmidadeMin: dataDay.mediaUmidadeMin,
          mediaUmidadeMax: dataDay.mediaUmidadeMax,
        }
      ]

      return (
        <section
          className='w-full md:max-w-screen-xl place-items-center mx-10 xl:mx-0 md:mx-0'
        >
          <Card
            variant="gradient"
            className="shadow-xl place-items-center shadow-gray-800 p-6 min-w-full
          bg-gray-300 text-gray-800
          dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900"
          >
            <Typography
              className="font-bold mt-3 w-80 text-gray-400 dark:text-gray-800 md:w-full text-center"
            >
              Chuva e Umidade
            </Typography>
            <table className="w-full min-w-min table-auto text-center text-xs">
              <thead>
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th key={head} className="border-b border-gray-300 pb-4 pt-10">
                      <Typography
                        variant="small"
                        // color="blue-gray"
                        className="font-bold leading-none"
                      >
                        {head}
                      </Typography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map(({ chuva, mediaUmidade, mediaUmidadeMin, mediaUmidadeMax }, index) => {
                  const isLast = index === TABLE_ROWS.length - 1;
                  const classes = isLast ? "py-4" : "py-4 border-b border-gray-300";

                  return (
                    <tr key={chuva} className="">
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {chuva}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {mediaUmidade.toFixed(2)}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {mediaUmidadeMin.toFixed(2)}
                        </Typography>
                      </td>
                      <td className={classes}>
                        <Typography
                          variant="small"
                          className="text-blue-gray-400"
                        >
                          {mediaUmidadeMax.toFixed(2)}
                        </Typography>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </section>
      )
    }

    const GraphRain = () => {

      return (
        <div>Grafico Chuva</div>
      )
    }

    const monthAndYearString = (date) => {
      const options = {
        // weekday: "long",
        year: "numeric",
        month: "long",
        // day: "numeric",
        // hour: "numeric",
        // minute: "numeric",
      }
      const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", options)
      const str = dateTimeFormat.format(new Date(date))
      return str.charAt(0).toUpperCase() + str.slice(1)

    }

    return (
      <section className="flex flex-col justify-center items-center mt-3 gap-5 w-full">
        <div className="flex flex-col justify-center items-center">
          <Typography variant="lead" color="blue-gray" className="font-bold">
            Métricas de {monthAndYearString(date)}
          </Typography>
        </div>
        <TableTemp />
        <TableUmi />
        <GraphRain />
        <TableDaysMonth
          headers={[
            { column: "dia", label: "Data" },
            { column: "chuva", label: "Chuva" },
            { column: "tempMaxima", label: "Temp Máxima" },
            { column: "tempMinima", label: "Temp Mínima" },
            { column: "umiMaxima", label: "Umi Mínima" },
            { column: "umiMinima", label: "Umi Mínima" },
          ]}
          data={dadosDiarios}
          // isLoading={isLoading}
          isLoading={false}
          loadingTag={<h1>Loading...</h1>}
        />

        {/* <div className="flex flex-wrap gap-y-3 mb-6 w-full max-w-screen-xl justify-between">

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

        </div> */}

        {/* {rain && <Grafico dataDay={dataDay} label={"Chuva"} />}
        <Grafico dataDay={dataDay} label={"Temperatura"} />
        <Grafico dataDay={dataDay} label={"Umidade"} /> */}
        {/* <Grafico dataDay={dataDay} label={"Pressão"} maxMin={maxMin}/> */}
      </section>
    )
  }

  const Calendar = () => {
    const renderMonthContent = (month, shortMonth, longMonth, day) => {
      const fullYear = new Date(day).getFullYear();
      const tooltipText = `${longMonth} de ${fullYear}`;

      return <span title={tooltipText}>{shortMonth}</span>;
    };
    return (
      <section className="flex justify-center">
        <DatePicker
          selected={new Date()}
          // selected={date}
          onChange={(date) => handleChange(date)}
          minDate={new Date("2019-09-01")}
          maxDate={new Date()}
          // showYearDropdown={true}
          // scrollableYearDropdown={true}
          inline={true}
          renderMonthContent={renderMonthContent}
          showMonthYearPicker
          dateFormat="MM/yyyy"
        // wrapperClassName="bg-transparent"
        />
      </section>
    );
  }

  return (
    <>
      <Calendar />
      <Container />
    </>
  )
}

export default MetricasMes