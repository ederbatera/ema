import { useEffect, useState, useContext } from 'react';
import { motion } from "framer-motion"
import { Alert, AlertDescription } from "@/components/ui/alert"

import axios from "axios";
const api = axios.create()

import { FaTemperatureLow } from "react-icons/fa6";
import { RiWaterPercentLine } from "react-icons/ri";
import { FaCloudShowersHeavy } from "react-icons/fa";
import { CiCircleAlert } from "react-icons/ci";
import { GlobalContext } from '../../context/GlobalContext';

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
        const response = await api.get("https://backend.agudos.net/previsao")
        const data = response.data
        return data;
    }
    catch (err) {
        console.error("ops! ocorreu um erro: " + err);
        throw err; // Opcional: re-throw o erro para permitir tratamento em outro lugar
    }
}


const Previsao = () => {

    const [previsao, setPrevisao] = useState(null)
    const [dia, setDia] = useState(0)

    // const { socket } = useContext(GlobalContext)

    const handleClick = (e, i) => {
        e.preventDefault()
        setDia(i)
    }

    // useEffect(() => {
    //     socket.on('previsao', data => {
    //         console.log(data)
    //         data.forEach(item => {
    //             item.date_str = getDayOfWeek(item.date);
    //         })
    //         setPrevisao(data)

    //     })
    //     return () => socket.off()

    // }, []);

    useEffect(() => {
        getPrevisao()
            .then((data) => {
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

    // eslint-disable-next-line react/prop-types
    const Dia = ({ indice }) => {

        useEffect(() => {
            setDia(indice)
        }, [indice])

        let day
        switch (indice) {
            case 0:
                day = `Hoje`
                break
            case 1:
                day = `Amanhã`
                break
            default:
                day = `${getDayOfWeek(previsao[dia].date)} ${previsao[dia].date_br}`
                break
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

                        <div className='flex items-center align-middle gap-x-1 mb-2 text-start'>
                            <CiCircleAlert size={15} />
                            <div className='font-bold'>{day}</div>
                        </div>
                        <div className='flex flex-col md:flex-row md:justify-around items-center gap-y-2 md:gap-y-0'>
                            <div className='md:flex md:flex-col hidden items-center'>
                                <div>Amanhecer</div>
                                <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.dawn}.png`} className='w-14' />
                                <div>{previsao[dia].text_icon.text.phrase.dawn}</div>
                            </div>
                            <div className='flex flex-col items-center'>
                                <div>Manhã</div>
                                <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.morning}.png`} className='w-14' />
                                <div>{previsao[dia].text_icon.text.phrase.morning}</div>
                            </div>
                            <div className='flex flex-col items-center'>
                                <div>Tarde</div>
                                <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.afternoon}.png`} className='w-14' />
                                <div>{previsao[dia].text_icon.text.phrase.afternoon}</div>
                            </div>
                            <div className='flex flex-col items-center'>
                                <div>Noite</div>
                                <img src={`https://services.agudos.net/images/previsao/45px/${previsao[dia].text_icon.icon.night}.png`} className='w-14' />
                                <div>{previsao[dia].text_icon.text.phrase.night}</div>
                            </div>

                            <div className='text-center justify-center'>
                                <div className='flex gap-x-1 mt-1 mx-auto items-center'>
                                    <FaTemperatureLow size={15} className='text-red-300' />
                                    <div className='flex items-center'>
                                        <ArrowUp />
                                        {previsao[dia].temperature.max}ºC
                                    </div>
                                    <div className='flex items-center'>
                                        <ArrowDown />
                                        {previsao[dia].temperature.min}ºC
                                    </div>
                                </div>
                                <div className='flex gap-x-1 mx-auto items-center'>
                                    <RiWaterPercentLine size={15} className='text-blue-300' />
                                    <div className='flex items-center'>
                                        <ArrowUp />
                                        {previsao[dia].humidity.max}%
                                    </div>
                                    <div className='flex items-center'>
                                        <ArrowDown />
                                        {previsao[dia].humidity.min}%
                                    </div>
                                </div>
                                <div className='flex gap-x-1 mx-auto items-center'>
                                    <FaCloudShowersHeavy />
                                    {previsao[dia].rain.precipitation} mm
                                    <div>~</div>
                                    <div>{previsao[dia].rain.probability}%</div>
                                </div>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            </motion.span >
        )
    }

    return (
        <>
            <Dia indice={dia} />
            {previsao.map((dia, i) => {
                if (i == 6) return (
                    <span key={i} className='mb-10 md:mb-0 xl:mb-0 md:hidden'></span>
                )
                return (
                    <motion.span
                        className='w-full md:max-w-[10rem] place-items-center mx-10 xl:mx-0 md:mx-0 md:mb-10 xl:mb-10 cursor-pointer'
                        variants={variants}
                        initial="hide"
                        whileInView="show"
                        transition={{ duration: 0.8, ease: "easeInOut", }}
                        key={i}
                        onClick={e => handleClick(e, i)}

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
                                            <RiWaterPercentLine size={15} className='text-blue-300' />
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
            })}
        </>
    )
}


export { Previsao };