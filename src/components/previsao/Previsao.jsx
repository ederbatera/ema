import { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"

import axios from "axios";
const api = axios.create()

import { FaTemperatureLow } from "react-icons/fa6";
import { RiWaterPercentLine } from "react-icons/ri";
import { FaCloudShowersHeavy } from "react-icons/fa";

const ArrowUp = () => {
    return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>)
}

const ArrowDown = () => {
    return (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 11.2929L11.1464 8.14645C11.3417 7.95118 11.6583 7.95118 11.8536 8.14645C12.0488 8.34171 12.0488 8.65829 11.8536 8.85355L7.85355 12.8536C7.75979 12.9473 7.63261 13 7.5 13C7.36739 13 7.24021 12.9473 7.14645 12.8536L3.14645 8.85355C2.95118 8.65829 2.95118 8.34171 3.14645 8.14645C3.34171 7.95118 3.65829 7.95118 3.85355 8.14645L7 11.2929L7 2.5C7 2.22386 7.22386 2 7.5 2Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>)
}

function getDayOfWeek(dateString) {
    const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const date = new Date(dateString);
    return daysOfWeek[date.getDay()];
}

const variants = {
    hide: {
        opacity: 0,
        y: 100
    },
    show: {
        opacity: 1,
        y: 0
    },
}


const getPrevisao = async () => {

    try {
        const response = await api.get("https://agudos.net/includes/previsao.json")
        const data = response.data
        return data;
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
}

const Previsao = ({ indice }) => {


    const [dia, setDia] = useState(0)
    const [previsao, setPrevisao] = useState(null)


    useEffect(() => {
        setDia(indice)
    }, [indice])

    useEffect(() => {
        getPrevisao()
            .then(({ data }) => {
                data.forEach(item => {
                    item.date_str = getDayOfWeek(item.date);
                })
                setPrevisao(data)
            })
            .catch((error) => {
                console.error('Erro ao obter previsão:', error)
            });
    }, []);

    if (!previsao) {
        return <div>Carregando...</div>;
    }


    return (
        <motion.span
            className='w-full text-center mx-10 xl:mx-0 md:mx-0'
            variants={variants}
            initial="hide"
            whileInView="show"
            transition={{ duration: 0.8, ease: "easeInOut", }}

        >
            <Alert className="border-0 shadow-xl rounded-xl
                    bg-gray-300 text-gray-800 shadow-gray-800
                    dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                <AlertDescription className="">

                    <div className='mb-2'>
                        {dia == 0 ? "Hoje" : previsao[dia].date_br}
                    </div>

                    <div className="flex justify-between md:mx-10">
                        <div className='flex flex-col'>
                            <div>Manhã</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.morning}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>Tarde</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.afternoon}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>Noite</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.night}.png`} />
                        </div>
                    </div>

                    <div className='mb-2'>
                        {previsao[dia].text_icon.text.pt}
                    </div>
                    <div className='flex gap-x-5 text-center justify-center'>

                        <div className='flex-col text-center p-3'>
                            <div className='text-start'>
                                Temperatura
                            </div>
                            <div>
                                <div className='flex gap-x-1'>
                                    <div className='font-thin'>Máx</div>
                                    <div className='font-bold'>{previsao[dia].temperature.max}ºC</div>
                                </div>
                                <div className='flex gap-x-1'>
                                    <div className='font-thin'>Mín</div>
                                    <div className='font-bold'>{previsao[dia].temperature.min}ºC</div>
                                </div>
                            </div>
                        </div>

                        <div className='flex-col text-center p-3'>
                            <div className='text-start'>
                                Umidade
                            </div>
                            <div>
                                <div className='flex gap-x-1'>
                                    <div className='font-thin'>Máx</div>
                                    <div className='font-bold'>{previsao[0].humidity.max}%</div>
                                </div>
                                <div className='flex gap-x-1'>
                                    <div className='font-thin'>Mín</div>
                                    <div className='font-bold'>{previsao[0].humidity.min}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        {`Chuva: ${previsao[0].rain.precipitation} mm  Probabilidade: ${previsao[0].rain.probability}%`}
                    </div>
                </AlertDescription>
            </Alert>
        </motion.span >
    )
}


const PrevisaoEstendida = () => {
    const [previsao, setPrevisao] = useState(null)


    useEffect(() => {
        getPrevisao()
            .then(({ data }) => {
                data.forEach(item => {
                    item.date_str = getDayOfWeek(item.date);
                })
                setPrevisao(data)
            })
            .catch((error) => {
                console.error('Erro ao obter previsão:', error)
            });
    }, []);

    if (!previsao) {
        return <div>Carregando...</div>;
    }

    return (
        <motion.span
            className='w-full text-center mx-10 xl:mx-0 md:mx-0 mb-10'
            variants={variants}
            initial="hide"
            whileInView="show"
            transition={{ duration: 0.8, ease: "easeInOut", }}

        >
            <Alert className="border-0 shadow-xl rounded-xl
                    bg-gray-300 text-gray-800 shadow-gray-800
                    dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                <AlertDescription className="">
                    <div className='mb-2'>
                        Previsão 7 dias
                    </div>
                    <div className="flex justify-between md:mx-10">
                        <div className='flex flex-col'>
                            <div>{previsao[1].date_br}</div>
                            <div>{previsao[1].date_str}</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[1].text_icon.icon.day}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>{previsao[2].date_br}</div>
                            <div>{previsao[2].date_str}</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[2].text_icon.icon.day}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>{previsao[3].date_br}</div>
                            <div>{previsao[3].date_str}</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[3].text_icon.icon.day}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>{previsao[4].date_br}</div>
                            <div>{previsao[4].date_str}</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[4].text_icon.icon.day}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>{previsao[5].date_br}</div>
                            <div>{previsao[5].date_str}</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[5].text_icon.icon.day}.png`} />
                        </div>
                        <div className='flex flex-col'>
                            <div>{previsao[6].date_br}</div>
                            <div>{previsao[6].date_str}</div>
                            <img src={`https://services.agudos.net/images/previsao/45px/${previsao[6].text_icon.icon.day}.png`} />
                        </div>
                    </div>
                    {/* <div className='mb-2'>
                        {previsao[0].text_icon.text.pt}
                    </div> */}
                </AlertDescription>
            </Alert>
        </motion.span >
    )
}

const PrevisaoEl = () => {
    const [previsao, setPrevisao] = useState(null)

    useEffect(() => {
        getPrevisao()
            .then(({ data }) => {
                data.forEach(item => {
                    item.date_str = getDayOfWeek(item.date);
                })
                setPrevisao(data)
            })
            .catch((error) => {
                console.error('Erro ao obter previsão:', error)
            });
    }, []);

    if (!previsao) {
        return <div>Carregando...</div>;
    }

    return (
        previsao.map((dia, i) => {
            if (i == 0) return
            return (
                <motion.span
                    className='w-full md:max-w-[10rem] place-items-center mx-10 xl:mx-0 md:mx-0 mb-10 sm:mb-0'
                    variants={variants}
                    initial="hide"
                    whileInView="show"
                    transition={{ duration: 0.8, ease: "easeInOut", }}
                    key={i}

                >
                    <Alert className="border-0 shadow-xl rounded-xl
                            bg-gray-300 text-gray-800 shadow-gray-800
                            dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                        <AlertDescription className="">
                            <div className="">
                                <div className='flex flex-col'>
                                    <div className='flex gap-x-1 m-auto font-thin'>
                                        <div>{dia.date_str}</div>
                                        <div className=''>{dia.date_br.substr(0, 5)}</div>
                                    </div>

                                    <img src={`https://services.agudos.net/images/previsao/45px/${dia.text_icon.icon.day}.png`}
                                        className='w-12 mt-1 m-auto'
                                    />

                                    <div className='flex gap-x-1 mt-1 mx-auto items-center'>
                                        <FaTemperatureLow size={15} className='text-red-300' />
                                        <div className='flex items-center'>
                                            <ArrowUp />
                                            {dia.temperature.max}
                                        </div>
                                        <div className='flex items-center'>
                                            <ArrowDown />
                                            {dia.temperature.min}
                                        </div>
                                    </div>
                                    <div className='flex gap-x-1 mx-auto items-center'>
                                        <RiWaterPercentLine size={15} className='text-blue-300'/>
                                        <div className='flex items-center'>
                                            <ArrowUp />
                                            {dia.humidity.max}
                                        </div>
                                        <div className='flex items-center'>
                                            <ArrowDown />
                                            {dia.humidity.min}
                                        </div>
                                    </div>
                                    <div className='flex gap-x-1 mx-auto items-center'>
                                            <FaCloudShowersHeavy />
                                            {dia.rain.precipitation} mm
                                            <div> ~ </div>
                                            <div>{dia.rain.probability}%</div>
                                        
                                    </div>

                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                </motion.span >
            )
        })
    )
}


export { Previsao, PrevisaoEstendida, PrevisaoEl };