import { useContext } from "react"
import { GlobalContext } from "../../context/GlobalContext"
import { Typography } from "@material-tailwind/react";
import useWindowDimensions from "../../functions/useWindowDimensions"

import { PiClockClockwiseFill } from "react-icons/pi";


const TopPage = () => {
    const { currentValues, clientsConnected } = useContext(GlobalContext)
    const { height, width } = useWindowDimensions();

    const semana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    function getDiaSemana(date) {
        var data = new Date(date);
        var weekday = data.getDay();
        return semana[weekday];
    }

    function getMes(date) {
        var data = new Date(date);
        var mes = data.getMonth();
        return meses[mes];
    }


    const formatDate = (data) => {
        var date = new Date(data); // 2024/08/23 09:55:00
        const dia_semana = getDiaSemana(date)
        const dia = date.getDate()
        const mes = getMes(date)
        const ano = date.getFullYear()
        const horas = ("0000" + date.getHours()).slice(-2)
        const minutos = ("0000" + date.getMinutes()).slice(-2) 


        return (

            <span className="font-extralight text-sm md:text-md flex gap-1
                text-gray-800
                dark:text-blue-gray-400">
                <PiClockClockwiseFill className="align-bottom" size={20}/>
                Última Leitura:{width > 720 && (dia_semana + ', ' + dia + ' de ' + mes + ' de ' + ano + ' às ')}
                <span className="font-bold">{horas}:{minutos}</span>
            </span>
        );

    }



    return (
        <div className="flex flex-wrap justify-center items-center mt-2 text-center gap-2 md:mx-auto mx-10 max-w-screen-xl">
            {currentValues?.data ? formatDate(currentValues.data) :
                <Typography
                    as="span"
                    variant="paragraph"
                    className="h-4 w-1/3 rounded-full animate-pulse bg-gray-300"
                >
                    &nbsp;
                </Typography>}
        </div>
    )
}

export default TopPage
