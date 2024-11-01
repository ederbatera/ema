'use client'
import { useContext, useEffect } from 'react'
import { GlobalContext } from '../../context/GlobalContext'
import { Card, CardBody, CardHeader, Typography } from '@material-tailwind/react'
import { FaTemperatureHalf } from "react-icons/fa6";
import { BsClock } from "react-icons/bs";
import { WiBarometer, WiHumidity } from "react-icons/wi";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { PiWindLight } from "react-icons/pi";
import { WiWindDeg } from "react-icons/wi";
import { useRef } from "react"
import { Droplets, Wind, Thermometer, CircleGauge, MousePointer, ClockArrowUp, ClockArrowDown } from 'lucide-react';

import {
    motion,
    useAnimation,
    useInView,
    useScroll,
    useTransform,
} from "framer-motion"


const Principais = () => {

    const { currentValues, maxMinDay } = useContext(GlobalContext)


    let wind

    switch (currentValues.w_dir) {
        case "N": wind = { 'simb': 'rotate-180', 'direcao': "NORTE", 'grau': "± 0º" }
            break;
        case "S": wind = { 'simb': 'rotate-0', 'direcao': "SUL", 'grau': "± 180º" }
            break;
        case "W": wind = { 'simb': 'rotate-90', 'direcao': "OESTE", 'grau': "± 270º" }
            break;
        case "E": wind = { 'simb': '-rotate-90', 'direcao': "LESTE", 'grau': "± 90º" }
            break;
        case "NW": wind = { 'simb': 'rotate-[135deg]', 'direcao': "NOROESTE", 'grau': "± 315º" }
            break;
        case "NE": wind = { 'simb': 'rotate-[225deg]', 'direcao': "NORDESTE", 'grau': "± 45º" }
            break;
        case "SW": wind = { 'simb': 'rotate-45', 'direcao': "SUDOESTE", 'grau': "± 225º" }
            break;
        case "SE": wind = { 'simb': 'rotate-[315deg]', 'direcao': "SUDESTE", 'grau': "± 135º" }
            break;
        case "--": wind = { 'simb': false, 'direcao': "-", 'grau': "-" }
            break;

        default:
            wind = { 'simb': "-", 'direcao': "-", 'grau': "-" }
            break;
    }

    // const variants = {
    //     hide: {
    //         y: 100,
    //         opacity: .1,
    //         scale: .1
    //     },
    //     show: {
    //         y: 0,
    //         opacity: 1,
    //         scale: 1,
    //         rotate: -10,
    //         transition: {
    //             type: "spring",
    //             bounce: 0.1,
    //             duration: 1
    //         }
    //     }
    // };

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

    // let theme;
    // if (localStorage.getItem('vite-ui-theme') === 'dark' || (!('vite-ui-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    //     theme = 'white'
    // }
    // else {
    //     theme = 'teal'
    // }
    // console.log(theme)


    return (
        <>
            <motion.section
                    className='w-full md:max-w-[15rem] place-items-center mx-10 xl:mx-0 md:mx-0'
                    variants={variants}
                    initial="hide"
                    whileInView="show"
                    transition={{ duration: .8, ease: "easeInOut",  }}

                >
            <Card
                // color="deep-purple"
                variant="gradient"
                className="shadow-xl place-items-center shadow-gray-800 p-6 min-w-full
                          bg-gray-300 text-gray-800
                          dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 mb-8 rounded-none border-b pb-8 
                            border-blue-gray-400 
                            dark:border-white/20"
                >
                    <Typography
                        variant="h3"
                        // color="gray"
                        className="font-light flex align-baseline justify-center text-center
                                text-gray-400
                                dark:text-gray-800"
                    >
                        <Thermometer size={30} strokeWidth={1.5} />
                    </Typography>
                    <Typography
                        variant="h4"
                        // color="white"
                        className="mt-1 flex justify-center gap-1 text-7xl font-normal
                        text-blue-gray-400"
                    >
                        {currentValues.temp_atual}
                        <span className="mt-2 text-4xl

                                dark:text-gray-800"
                        >
                            ºC</span>
                    </Typography>
                </CardHeader>
                <CardBody className="p-0">
                    <ul className="flex flex-col gap-1">
                        <li className="flex items-center gap-1">
                            <span className="opacity-70"><ClockArrowUp size={25} strokeWidth={1.5} /></span>
                            <Typography className="font-normal">
                                {maxMinDay?.maxTemp ? maxMinDay.maxTemp.value + ' ºC' : ""}
                            </Typography>
                            <Typography className="font-normal">
                                {maxMinDay?.maxTemp ? ' - ' + formatDate(maxMinDay.maxTemp.date) + 'h' : ""}
                            </Typography>
                        </li>
                        <li className="flex items-center gap-1">
                            <span className='opacity-70'><ClockArrowDown size={25} strokeWidth={1.5} /></span>
                            <Typography className="font-normal">
                                {maxMinDay?.minTemp ? maxMinDay.minTemp.value + ' ºC' : ""}
                            </Typography>
                            <Typography className="font-normal">
                                {maxMinDay?.minTemp ? ' - ' + formatDate(maxMinDay.minTemp.date) + 'h' : ""}
                            </Typography>
                        </li>
                    </ul>
                </CardBody>
            </Card>
            </motion.section>
            
            <motion.section
                className='w-full md:max-w-[15rem] place-items-center mx-10 xl:mx-0 md:mx-0'
                variants={variants}
                initial="hide"
                whileInView="show"
                transition={{ duration: .8, ease: "easeInOut", }}
            >
            <Card
                // color="deep-purple"
                variant="gradient"
                className="shadow-xl place-items-center shadow-gray-800 p-6 min-w-full
                          bg-gray-300 text-gray-800
                          dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 mb-8 rounded-none border-b pb-8 
                            border-blue-gray-400 
                            dark:border-white/20"
                >
                    <Typography
                        variant="h3"
                        // color="gray"
                        className="font-light flex align-baseline justify-center text-center
                                text-gray-400
                                dark:text-gray-800"
                    >
                        <Droplets size={30} strokeWidth={1.5} />
                    </Typography>
                    <Typography
                        variant="h4"
                        // color="white"
                        className="mt-1 flex justify-center gap-1 text-7xl font-normal
                            text-blue-gray-400"
                    >
                        {currentValues.umi_atual}{" "}
                        <span className="mt-2 text-4xl

                            dark:text-gray-800"
                        >
                            %
                        </span>
                    </Typography>
                </CardHeader>
                <CardBody className="p-0">
                    <ul className="flex flex-col gap-1">
                        <li className="flex items-center gap-1">
                            {/* <span className="rounded-full border border-white/20 bg-white/20 p-1"><FaArrowUp /> </span> */}
                            <span className="opacity-70"><ClockArrowUp size={25} strokeWidth={1.5} /></span>
                            <Typography className="font-normal">
                                {maxMinDay?.maxUmi ? maxMinDay.maxUmi.value + ' %' : ""}
                            </Typography>
                            <Typography className="font-normal">
                                {maxMinDay?.maxUmi ? ' - ' + formatDate(maxMinDay.maxUmi.date) + 'h' : ""}
                            </Typography>
                        </li>
                        <li className="flex items-center gap-1">
                            <span className='opacity-70'><ClockArrowDown size={25} strokeWidth={1.5} /></span>
                            <Typography className="font-normal">
                                {maxMinDay?.minUmi ? maxMinDay.minUmi.value + ' %' : ""}
                            </Typography>
                            <Typography className="font-normal">
                                {maxMinDay?.minUmi ? ' - ' + formatDate(maxMinDay.minUmi.date) + 'h' : ""}
                            </Typography>
                        </li>
                    </ul>
                </CardBody>
            </Card>
            </motion.section>

            <motion.section
                className='w-full md:max-w-[15rem] place-items-center mx-10 xl:mx-0 md:mx-0'
                variants={variants}
                initial="hide"
                whileInView="show"
                transition={{ duration: .8, ease: "easeInOut", }}
            >
            <Card
                // color="deep-purple"
                variant="gradient"
                className="shadow-xl place-items-center shadow-gray-800 p-6 min-w-full
                          bg-gray-300 text-gray-800
                          dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 mb-8 rounded-none border-b pb-8 
                            border-blue-gray-400 
                            dark:border-white/20"
                >
                    <Typography
                        variant="h3"
                        // color="gray"
                        className="font-light flex align-baseline justify-center text-center
                                text-gray-400
                                dark:text-gray-800"
                    >
                        <CircleGauge size={30} strokeWidth={1.5} />
                    </Typography>
                    <Typography
                        variant="h4"
                        // color="white"
                        className="mt-1 flex justify-center gap-1 text-7xl font-normal
                            text-blue-gray-400"
                    >
                        {currentValues.p_atm}{" "}
                        <span className="mt-2 text-4xl

                            dark:text-gray-800"
                        >
                            HPa
                        </span>
                    </Typography>
                </CardHeader>
                <CardBody className="p-0">
                    <ul className="flex flex-col gap-1">
                        <li className="flex items-center gap-1">
                            <span className="opacity-70"><ClockArrowUp size={25} strokeWidth={1.5} /></span>
                            <Typography className="font-normal">
                                {maxMinDay?.maxPress ? maxMinDay.maxPress.value + ' HPa' : ""}
                            </Typography>
                            <Typography className="font-normal">
                                {maxMinDay?.maxPress ? ' - ' + formatDate(maxMinDay.maxPress.date) + 'h' : ""}
                            </Typography>
                        </li>
                        <li className="flex items-center gap-1">
                            <span className='opacity-70'><ClockArrowDown size={25} strokeWidth={1.5} /></span>
                            <Typography className="font-normal">
                                {maxMinDay?.minPress ? maxMinDay.minPress.value + ' HPa' : ""}
                            </Typography>
                            <Typography className="font-normal">
                                {maxMinDay?.minPress ? ' - ' + formatDate(maxMinDay.minPress.date) + 'h' : ""}
                            </Typography>
                        </li>
                    </ul>
                </CardBody>
            </Card>
            </motion.section>

            <motion.section
                className='w-full md:max-w-[15rem] place-items-center mx-10 xl:mx-0 md:mx-0'
                variants={variants}
                initial="hide"
                whileInView="show"
                transition={{ duration: .8, ease: "easeInOut", }}
            >
            <Card
                // color="deep-purple"
                variant="gradient"
                className="shadow-xl place-items-center shadow-gray-800 p-6 min-w-full
                          bg-gray-300 text-gray-800
                          dark:bg-black dark:text-blue-gray-200 dark:shadow-blue-gray-900">
                <CardHeader
                    floated={false}
                    shadow={false}
                    color="transparent"
                    className="m-0 mb-8 rounded-none border-b pb-8 
                            border-blue-gray-400 
                            dark:border-white/20"
                >
                    <Typography
                        variant="h3"
                        // color="gray"
                        className="font-light flex align-baseline justify-center text-center
                                text-gray-400
                                dark:text-gray-800"
                    >
                        <Wind size={30} strokeWidth={1.5} />
                    </Typography>
                    <Typography
                        variant="h4"
                        // color="white"
                        className="mt-1 flex justify-center gap-1 text-7xl font-normal
                            text-blue-gray-400"
                    >
                        {currentValues.wind}
                        <span className="mt-2 text-xl

                            dark:text-gray-800"
                        >Km/h {currentValues.w_dir}
                            <div className='mx-2 flex'>{wind?.grau ? wind.grau : ""}
                                <span className='text-orange-500 dark:text-deep-orange-200 dark:opacity-70'>
                                    {wind?.simb ? (<WiWindDeg size={30} className={`ms-1 ${wind.simb}`} />) : ("")}
                                </span>
                            </div>

                        </span>
                    </Typography>
                </CardHeader>
                <CardBody className="p-0">
                    <ul className="flex flex-col gap-1">
                        <li className="flex items-center gap-1">
                            <Typography className="font-normal">
                                Rajada {currentValues.raj} Km/h
                            </Typography>
                        </li>
                        <li className="flex items-center">
                            <Typography className="font-thin">
                                Direção 
                                <span className="font-bold text-orange-500 dark:text-deep-orange-200 dark:opacity-70 ms-1">{currentValues.dir_raj} </span> 
                                - {currentValues.qtr_raj}h
                                </Typography>
                        </li>
                    </ul>
                </CardBody>
            </Card>
            </motion.section>
        </>

    )

}



const formatDate = (data) => {
    var date = new Date(data); // 2024/08/23 09:55:00
    const horas = ("0000" + date.getHours()).slice(-2)
    const minutos = ("0000" + date.getMinutes()).slice(-2)

    return `${horas}:${minutos}`

}

export default Principais