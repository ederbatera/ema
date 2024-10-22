import { motion } from "framer-motion"
import { useContext } from "react"
import { GlobalContext } from "../../context/GlobalContext"


import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert"

const Weather = () => {

    const { weather } = useContext(GlobalContext)

    // if(!weather?.clouds?.all)  return

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

    function converterDistancia(distanciaStr) {
        const distancia = parseInt(distanciaStr, 10); // Converte a string para número

        if (isNaN(distancia)) {
            return "Valor inválido";
        }

        if (distancia >= 1000) {
            const km = (distancia / 1000).toFixed(1); // Divide por 1000 e mantém uma casa decimal
            return `${km} km`;
        } else {
            return `${distancia} metros`;
        }
    }

    function capitalizar(str) {
        return str
            .split(' ')
            .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
            .join(' ')
    }

    if (weather.visibility) {
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
                    {/* <AlertTitle>Dados adicionais</AlertTitle> */}
                    <AlertDescription className="">

                        <div className="flex justify-between md:mx-10">
                            <div>
                                Visibilidade:
                                <div className="font-semibold">{converterDistancia(weather.visibility)}</div>
                            </div>
                            <div>
                                Núvens:
                                <div className="font-semibold">{weather.clouds.all}%</div>
                            </div>
                            <div>
                                Condições:
                                <div className="font-semibold">{capitalizar(weather.weather[0].description)}.</div>
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            </motion.span>
        )
    }else{
        return (<span> Carregando... </span>)
    }

}


export default Weather