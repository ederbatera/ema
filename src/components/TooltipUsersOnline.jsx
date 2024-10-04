import { Tooltip, Typography } from "@material-tailwind/react";
import { useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";

import { FaRegEye } from "react-icons/fa";




const TooltipUsersOnline = () => {
    const { clientsConnected } = useContext(GlobalContext)
    return (
        <Tooltip
            className=" border rounded-xl shadow-xl 
                   bg-gray-300 text-gray-800 border-gray-500 shadow-gray-800
                   dark:text-gray-300 dark:bg-black dark:border-0 dark:shadow-blue-gray-900"
            content={
                <div className="w-100">
                    <Typography
                        // color="white"
                        className="flex font-medium p-2 gap-x-1">
                        <span>Usuários Online:</span>
                        <span className="font-bold">{clientsConnected - 1}</span>
                    </Typography>
                </div>
            }
            animate={{
                mount: {
                    scale: 1,
                    y: 13,
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
            <span className="flex md:me-3 text-base ms-auto gap-x-1">
                <FaRegEye size={20} className="align-bottom" />
                <span className="align-top text-light-blue-500 dark:!text-light-blue-100">{clientsConnected - 1}</span>
            </span>

        </Tooltip>
    )
}

export default TooltipUsersOnline