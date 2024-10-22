import { motion } from "framer-motion"
import { useContext } from "react"
import { GlobalContext } from "../../context/GlobalContext"


import {
    Alert,
    AlertDescription,
    // AlertTitle,
} from "@/components/ui/alert"

const Advanceds = () => {

    const { currentValues } = useContext(GlobalContext)
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

    return (
        <motion.span
            // className='bg-teal-500 rounded-md shadow-xl shadow-black mt-6 p-6 text-center text-white w-full mx-10 xl:mx-0 md:mx-0'
            className='mt-6 w-full text-center mx-10 xl:mx-0 md:mx-0'
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
                            Umidade Absoluta:
                            <div className="font-semibold">{currentValues.umid_abs}g/m³</div>
                        </div>
                        <div>
                            Ponto de Orvalho:
                            <div className="font-semibold">{currentValues.dew_point}ºC</div>
                        </div>
                        <div>
                            Sensação Térmica:
                            <div className="font-semibold">{currentValues.sensation}ºC</div>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        </motion.span>
    )
}
 
export default Advanceds