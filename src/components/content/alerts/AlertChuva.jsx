import { useContext } from 'react'
import { GlobalContext } from '../../../context/GlobalContext'
import { Alert } from '@material-tailwind/react'
import { useState } from 'react'

import { FaCloudShowersHeavy } from "react-icons/fa";

const AlertChuva = () => {

    const [openAlert, setOpenAlert] = useState(true)

    const { currentValues } = useContext(GlobalContext)
    const chuva_vel = currentValues.chuva_vel
    const chuva = currentValues.intensidade_chuva

    if (chuva == null) return

    const IntensidadeChuva = () => {
        return (
            <div className='text-center'> {chuva} ({`${chuva_vel} mm/h`})</div>
        )
    }



    let color = 'blue'
    if (parseInt(chuva_vel) > 20) color = 'red'

    return (
        <Alert
            className='my-2 mx-auto max-w-screen-xl min-h-[4rem] rounded-xl justify-center items-center'
            open={openAlert}
            onClose={() => setOpenAlert(false)}
            color={color}
            variant={'ghost'}
        >
            <div className='flex flex-row gap-x-3 font-normal
                text-black
                dark:text-gray-400'
            >
                <FaCloudShowersHeavy size={20} />
                <IntensidadeChuva />
            </div>
        </Alert>
    )
}

export default AlertChuva