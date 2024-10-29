import { Card, Typography } from "@material-tailwind/react";

const TABLE_HEAD = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];


// eslint-disable-next-line react/prop-types
export function MediaTemperatura({ years }) {

    // console.log(years)

    if (!years || years == null) {
        return <div>Carregando...</div>;
    }


    return (
        <Card className="px-6 py-6 bg-transparent border flex items-center max-w-screen-xl mx-0 md:mx-auto
        bg-gray-300 dark:bg-black border-blue-50 dark:border-blue-gray-300">
            <div className="text-center font-bold">Média de Temperatura.</div>
            <table className="w-full text-center overflow-x-auto">
                <thead>
                    <tr>
                        {TABLE_HEAD.map((head) => (
                            <th key={head} className="border-b pb-4 pt-10
                            border-blue-50 dark:border-blue-gray-300">
                                <Typography
                                    // variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none text-xs
                                    dark:text-blue-gray-300"
                                >
                                    {head}
                                </Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="">
                    {Object.keys(years).map((ano) => {
                        // Obter os dados de chuva para o ano atual
                        if(ano >= 2025) return
                        const temp_medias = years[ano]["temp_media"];
                        return (
                            <tr key={ano} className="hover:bg-blue-gray-100 dark:hover:bg-gray-800">
                                <td className="border-b
                                border-blue-50 dark:border-blue-gray-300">
                                    <Typography 
                                    // variant="small" 
                                    color="blue-gray" 
                                    className="font-bold text-xs py-2 text-left
                                    dark:text-blue-gray-300">
                                        {ano}
                                    </Typography>
                                </td>
                                {temp_medias.map((valor, index) => (
                                    <td key={index} className=" border-b
                                     border-blue-50 dark:border-blue-gray-300">
                                        <Typography
                                            // variant="small"
                                            className="font-extralight text-gray-600 text-xs"
                                        >
                                            {valor !== null ? valor : "-"}
                                        </Typography>
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
}