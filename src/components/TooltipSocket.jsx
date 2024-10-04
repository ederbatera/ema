import { Tooltip, Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";

import { SiSocketdotio } from "react-icons/si";



const TooltipSocket = () => {
    const { connected } = useContext(GlobalContext)
    return (
        <Tooltip
            className=" border rounded-xl shadow-xl 
                      bg-gray-300 text-gray-800 border-gray-500 shadow-gray-800
                      dark:text-gray-300 dark:bg-black dark:border-0 dark:shadow-blue-gray-900"
            content={
                <div className="w-100">
                    <Typography
                        // color="white"
                        className="font-medium p-2">
                        {
                            connected ?
                                <span>Conexão WebSocket estabelecida!</span>
                                :
                                <span>Ops! Ocorreu um erro com a conexão WebSocket.</span>
                        }
                    </Typography>
                    <Typography
                        variant="small"
                        // color="white"
                        className="font-extralight p-2"
                    >
                        Conexões websockets são assimétricas, possibilitando o evio e recebimento de informações em tempo real.<br></br>
                        A EMA utiliza essa tecnologia para atualizar os dados da página em tempo real assim que novos dados são registrados.
                    </Typography>
                </div>
            }
            animate={{
                mount: {
                    scale: 1,
                    y: 20,
                    transition: {
                        duration: 0.2,
                    },
                },
                unmount: {
                    scale: 0,
                    y: -35,
                    transition: {
                        duration: 0.2
                    },
                },

            }}
        >
            <span className="">
                {connected ?
                    (<SiSocketdotio className="text-green-600 animate-ping h-3" />)
                    :
                    (<SiSocketdotio className="text-red-600 animate-bounce" />)
                }

            </span>

        </Tooltip>
    )
}

export default TooltipSocket