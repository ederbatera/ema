import { Card, Typography } from "@material-tailwind/react";

const TABLE_HEAD = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];


// eslint-disable-next-line react/prop-types
export function Table({ years, title, arr }) {

    // console.log(years)

    if (!years || years == null) {
        return <div>Carregando...</div>;
    }


    return (
        <Card className="px-6 py-6 bg-transparent border flex items-center max-w-screen-xl mx-0 md:mx-auto mb-6
        bg-gray-300 dark:bg-black border-blue-50 dark:border-blue-gray-300">
            <div className="text-center font-bold">{title}</div>
            <table className="text-center md:w-full">
                <thead>
                    <tr>
                        {TABLE_HEAD.map((head) => (
                            <th key={head} className="border-b pb-4 pt-10
                            border-blue-50 dark:border-blue-gray-300">
                                <Typography
                                    // variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none text-minusculo md:text-xs
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
                        if(ano >= 2026) return
                        if(ano == 2019 && (arr == "umi_media" || arr == "umi_media" || arr == "umi_media_min" || arr == "umi_media_max")) return
                        
                        const values = years[ano][arr];
                        return (
                            <tr key={ano} className="hover:bg-blue-gray-100 dark:hover:bg-gray-800">
                                <td className="border-b
                                border-blue-50 dark:border-blue-gray-300">
                                    <Typography 
                                    // variant="small" 
                                    color="blue-gray" 
                                    className="font-bold text-minusculo md:text-xs py-2 text-left
                                    dark:text-blue-gray-300">
                                        {ano}
                                    </Typography>
                                </td>
                                {
                                
                                // eslint-disable-next-line react/prop-types
                                values.map((valor, index) => (
                                    <td key={index} className=" border-b
                                     border-blue-50 dark:border-blue-gray-300">
                                        <Typography
                                            // variant="small"
                                            className="font-extralight text-gray-600 text-minusculo md:text-xs md:mx-0 mx-1"
                                        >
                                            {valor !== null ? valor : "-"}
                                        </Typography>
                                    </td>
                                ))
                                
                                }
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
}