import { Alert } from '@material-tailwind/react'
import { useState } from 'react'



const AlertsTop = ({color, variant, text}) => {

    const [openAlert, setOpenAlert] = useState(true)
    
    const alertProps =
    {
        "color": color ? color : "blue",
        "variant": variant ? variant : "ghost",
        "text": text ? text : "Alert!"
    }


    return (
        <>
            <div className="flex flex-col items-center justify-center gap-3 my-1">
                <Alert 
                open={openAlert} 
                onClose={() => setOpenAlert(false)} 
                color={alertProps.color} 
                variant={alertProps.variant}
                >
                    {alertProps.text ? alertProps.text : "Alerta!"}
                </Alert>

            </div>
        </>
    )
}

export default AlertsTop

/*
color = ["red","green","amber"]
variant = ["gradient","outlined","ghost"]
*/
