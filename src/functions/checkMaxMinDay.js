import { GlobalContext } from "../context/GlobalContext"
import { useContext, useState } from "react"


const checkMaxMinDay = (newValues) => {

    const { maxMinDay, setMaxMinDay } = useContext(GlobalContext)
    
    if (newValues.temp_atual <= maxMinDay.minTemp.value){
        const minTemp = { 
            value: newValues.temp_atual,
            date: newValues.data
        }
        setMaxMinDay(prev => { return { ...prev, minTemp: minTemp } })
    }

    if (newValues.temp_atual >= maxMinDay.maxTemp.value){
        const maxTemp = { 
            value: newValues.temp_atual,
            date: newValues.data
        }
        setMaxMinDay(prev => { return { ...prev, maxTemp: maxTemp } })
    }

    if (newValues.umi_atual <= maxMinDay.minUmi.value){
        const minUmi = { 
            value: newValues.umi_atual,
            date: newValues.data
        }
        setMaxMinDay(prev => { return { ...prev, minUmi: minUmi } })
    }

    if (newValues.umi_atual >= maxMinDay.maxUmi.value){
        const maxUmi = { 
            value: newValues.umi_atual,
            date: newValues.data
        }
        setMaxMinDay(prev => { return { ...prev, maxUmi: maxUmi } })
    }

    if (newValues.p_atm <= maxMinDay.minPress.value){
        const minPress = { 
            value: newValues.p_atm,
            date: newValues.data
        }
        setMaxMinDay(prev => { return { ...prev, minPress: minPress } })
    }

    if (newValues.p_atm >= maxMinDay.maxPress.value){
        const maxPress = { 
            value: newValues.p_atm,
            date: newValues.data
        }
        setMaxMinDay(prev => { return { ...prev, maxPress: maxPress } })
    }
}

export default checkMaxMinDay