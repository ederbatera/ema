// import React from 'react'
// import Temperature from './temperature/GraficoTemp'
import {
  motion,
  useAnimation,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion"
import { useContext, useEffect, useRef } from "react"

import { GraficoTemp } from './temperature/GraficoTemp'
import { GraficoPress } from './pressao/GraficoPress'
import {GraficoUmi} from './umidade/GraficoUmi'
import {GraficoChuvaDia} from './chuvas/GraficoChuvaDia'
import {GraficoChuvas} from './chuvas/GraficoChuvas'
import { GlobalContext } from "../../context/GlobalContext"



const Graficos = () => {

  const { currentValues } = useContext(GlobalContext);

  const variants = {
    hide: {
      opacity: 0,
      y: 100
    },
    show: {
      opacity: 1,
      y: 0
    },
  }

  return (
    // <section className='mt-6 max-w-screen-xl w-full  z-0 text-start mb-10 mx-10 xl:mx-0 md:mx-0'
     <section className="max-w-screen-xl w-full"
    // ref={containerRef}
    >
   
      {
      currentValues.chuva_dia > 0 && (
      <motion.div
        className="mt-6 text-start mx-10 xl:mx-0 md:mx-0"
        variants={variants}
        whileInView="show"
        initial="hide"
        transition={{ duration: 0.8, ease: "easeInOut",  }}
      >
        <GraficoChuvaDia />
      </motion.div>        
      )
    }


      <motion.div
        className="mt-6 text-start mx-10 xl:mx-0 md:mx-0"
        variants={variants}
        whileInView="show"
        initial="hide"
        transition={{ duration: 0.8, ease: "easeInOut",  }}
      >
        <GraficoTemp />
      </motion.div>
      
      <motion.div
        className="mt-6 text-start mx-10 xl:mx-0 md:mx-0"
        variants={variants}
        whileInView="show"
        initial="hide"
        transition={{ duration: 0.8, ease: "easeInOut",  }}
      >
        <GraficoUmi/>
      </motion.div>
      
      <motion.div
        className="mt-6 text-start mx-10 xl:mx-0 md:mx-0"
        variants={variants}
        whileInView="show"
        initial="hide"
        transition={{ duration: 0.8, ease: "easeInOut",  }}
      >
        <GraficoPress />
      </motion.div>
    
      <motion.div
        className="mt-6 text-start mx-10 xl:mx-0 md:mx-0"
        variants={variants}
        whileInView="show"
        initial="hide"
        transition={{ duration: 0.8, ease: "easeInOut",  }}
      >
        <GraficoChuvas/>
      </motion.div>
    </section>
  )
}

export default Graficos