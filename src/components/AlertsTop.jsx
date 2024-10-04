import { Alert } from '@material-tailwind/react'
import { useContext } from 'react'
import { GlobalContext } from '../context/GlobalContext'


const AlertsTop = () => {
    const {openAlert, alertProps, setOpenAlert} = useContext(GlobalContext)
    return (
        <>
            <div className="flex flex-col items-center justify-center gap-3 mt-1">
                <Alert open={openAlert} onClose={() => setOpenAlert(false)} color={alertProps.color} variant={alertProps.variant}> 
                    {alertProps.text? alertProps.text : "Alerta!"}
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


/*

if($lastdata->CHUVA_VEL > 0):

      if (($lastdata->CHUVA_VEL >0 ) && ($lastdata->CHUVA_VEL <=5 )):
          $intensidade_chuva = "Chuva Muito Fraca neste momento.";
      endif;

      if (($lastdata->CHUVA_VEL >5 ) && ($lastdata->CHUVA_VEL <=10)):
          $intensidade_chuva = "Chuva Fraca neste momento.";
      endif;

      if (($lastdata->CHUVA_VEL >10 ) && ($lastdata->CHUVA_VEL <=15 )):
          $intensidade_chuva = "Chuva Moderada Fraca neste momento.";
      endif;

      if (($lastdata->CHUVA_VEL >15 ) && ($lastdata->CHUVA_VEL <=20 )):
          $intensidade_chuva = "Alerta: Chuva Moderada neste momento!";
      endif;
             
      if (($lastdata->CHUVA_VEL >20 ) && ($lastdata->CHUVA_VEL <=25 )):
          $intensidade_chuva = "Alerta: Chuva Moderada Forte neste momento!";
      endif;      
             
      if (($lastdata->CHUVA_VEL >25 ) && ($lastdata->CHUVA_VEL <=30 )):
          $intensidade_chuva = "Alerta Especial: Chuva Forte neste momento!";
      endif;

      if (($lastdata->CHUVA_VEL >30 )):
          $intensidade_chuva = "Alerta Especial: Chuva Muito Forte neste momento!";
      endif;
	else:
			$intensidade_chuva = NULL;
endif;
*/