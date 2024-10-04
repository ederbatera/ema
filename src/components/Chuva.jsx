import { Rainify } from 'rainify'
import { useContext } from "react"
import { GlobalContext } from '../context/GlobalContext'
import { useTheme } from "../components/theme-provider"




const Chuva = () => {
  const { currentValues } = useContext(GlobalContext)
  const { effectiveTheme } = useTheme()
  
  const colorRain = effectiveTheme == "dark" ? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 255, 1)"
  
  if (currentValues.chuva_vel > 0) {
    return (
      <Rainify
        isRaining={true}
        intensity={100}
        color={ colorRain   }
        zIndex={99}
        speed={7}
        wind={(1.1 * currentValues.wind)}
        thickness={0.2}
        splashColor={colorRain}
        splashDuration={3}
      />
    )
  }
  else {
    return ("")
  }

}

export default Chuva