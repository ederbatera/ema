
// import { useContext, useEffect, useState } from 'react'
// import { GlobalContext } from '../../context/GlobalContext'
import Graficos from '../graficos/Graficos.jsx'
import Advanceds from './Advanceds.jsx'
import Sol from './Sol.jsx'
import Principais from './Principais.jsx'
import Weather from './Weather.jsx'
import TopPage from './TopPage.jsx'
import { PrevisaoMobile} from '../previsao/PrevisaoMobile.jsx'
import { Previsao} from '../previsao/Previsao.jsx'
import AlertChuva from '../alerts/AlertChuva.jsx'
import useWindowDimensions from "../../functions/useWindowDimensions.jsx"



const Home = () => {
  const { width } = useWindowDimensions();

  return (

    <>
      <TopPage />
      <AlertChuva/>
      <section className='flex flex-wrap gap-y-6 justify-between items-center text-center mt-6 mx-auto max-w-screen-xl'>        
        <Principais />
        <Advanceds />
        <Weather/>
        <Sol />
        <Graficos />
        {width > 401 ? (<Previsao/>) : <PrevisaoMobile/>}        
      </section> 
      
    </>


  )
}

export default Home