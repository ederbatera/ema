import { Card, Typography } from "@material-tailwind/react";

const TABLE_HEAD = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];


// eslint-disable-next-line react/prop-types
export function Chuvas({ years }) {

    // console.log(years)

    if (!years || years == null) {
        return <div>Carregando...</div>;
    }


    return (
        <Card className="h-full w-full px-6 pt-6 bg-transparent border border-blue-50 m-5">
            <div className="text-center font-bold">Precipitação.</div>
            <table className="w-full min-w-max table-auto text-left">
                <thead>
                    <tr>
                        {TABLE_HEAD.map((head) => (
                            <th key={head} className="border-b border-gray-300 pb-4 pt-10">
                                <Typography
                                    variant="small"
                                    color="blue-gray"
                                    className="font-bold leading-none"
                                >
                                    {head}
                                </Typography>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.keys(years).map((ano) => {
                        // Obter os dados de chuva para o ano atual
                        const chuvas = years[ano]["chuva"];
                        return (
                            <tr key={ano} className="hover:bg-gray-50">
                                <td className="py-4 border-b border-gray-300">
                                    <Typography variant="small" color="blue-gray" className="font-bold">
                                        {ano}
                                    </Typography>
                                </td>
                                {chuvas.map((valor, index) => (
                                    <td key={index} className="py-4 border-b border-gray-300">
                                        <Typography
                                            variant="small"
                                            className="font-normal text-gray-600"
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