
// import { useContext, useEffect, useState } from 'react'
// import { GlobalContext } from '../../../context/GlobalContext'
import Graficos from '../../graficos/Graficos.jsx'
import Advanceds from './Advanceds.jsx'
import Sol from './Sol.jsx'
import Principais from './Principais.jsx'
import Weather from './Weather.jsx'
import TopPage from './TopPage.jsx'
import {Previsao, PrevisaoEstendida, PrevisaoEl} from '../../previsao/Previsao.jsx'

// function CheckIcon() {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       fill="none"
//       viewBox="0 0 24 24"
//       strokeWidth={2}
//       stroke="currentColor"
//       className="h-3 w-3"
//     >
//       <path
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         d="M4.5 12.75l6 6 9-13.5"
//       />
//     </svg>
//   );
// }



// useEffect(() => {
//   fetchData();
// }, []); 


const Home = () => {

  return (

    <>
      <TopPage />
      <section className='flex flex-wrap gap-y-6 justify-between items-center text-center mt-6 mx-auto max-w-screen-xl'>        
        <Principais />
        <Advanceds />
        <Weather/>
        <Sol />
        <Graficos />
        <Previsao indice={0}/>
        {/* <PrevisaoEstendida/> */}
        <PrevisaoEl/>
      </section> 
      
    </>


  )
}

export default Home