import { motion } from "framer-motion"
import { useContext } from "react"
import { GlobalContext } from "../../context/GlobalContext"
import { BsSun } from "react-icons/bs";
import { TbSunrise } from "react-icons/tb";
import { TbSunset } from "react-icons/tb";


import {
    Alert,
    AlertDescription,
    // AlertTitle,
} from "@/components/ui/alert"

const Sol = () => {

    const { weather } = useContext(GlobalContext)

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

    const formatDate = (date) => {
        const pad = (num) => (num < 10 ? '0' + num : num);

        // const day = pad(date.getDate());
        // const month = pad(date.getMonth() + 1); // Janeiro é 0!
        // const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        return `${hours}:${minutes}:${seconds}`;
    }

    if (!weather?.sys?.sunrise) {
        return (<span>Carregando...</span>)
    }
    const nascer_do_sol = formatDate(new Date(weather.sys.sunrise * 1000))
    const por_do_sol = formatDate(new Date(weather.sys.sunset * 1000))


    return (
        <motion.span
            // className='bg-teal-500 rounded-md shadow-xl shadow-black mt-6 p-6 text-center text-white w-full mx-10 xl:mx-0 md:mx-0'
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
                        <div className="my-auto">
                            <BsSun size={25} />
                        </div>
                        <div className="text-center">
                            <div className="flex justify-center align-middle items-center">
                                <TbSunrise size={25} />
                            </div>
                            <div className="font-semibold">
                                <div>{nascer_do_sol}</div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="flex justify-center align-middle items-center">
                                <TbSunset size={25} />
                            </div>
                            <div className="font-semibold">
                                <div>{por_do_sol}</div>
                            </div>
                        </div>
                    </div>
                </AlertDescription>
            </Alert>
        </motion.span>
    )
}

export default Sol