import * as React from 'react';
import { useState, useEffect } from 'react'
import publicIP from 'react-native-public-ip';
import { socket } from './components/Socket';
// import AppProvider from './context/AppProvider'
// import AppHeader from './components/AppHeader'
// import AppFooter from './components/AppFooter'
import Favicon from '../public/favicon.ico';

import { Button, Container } from 'react-bootstrap/';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import NavbarTop from './components/NavbarTop';
import Logo from './components/Logo';
import DadosPrincipais from './components/DadosPrincipais';
import UltimoRegistroTop from './components/UltimoRegistroTop';
import FooterBottom from './components/FooterBottom';
import DadosAvancados from './components/DadosAvancados';
import Graficos from './components/Graficos';
import GraficoChuvas from './components/GraficoChuvas';
import DiasSemChuva from './components/DiasSemChuva';
import Previsao from './components/Previsao';

//import './App.css'


function App() {

  const [ip, setIp] = useState(['Loading...'])
  const [wsData, setWsData] = useState([])

  useEffect(() => {
    publicIP()
      .then(res => {
        setIp(res);
      })
      .catch(error => {
        console.log(error);
      });
  })

  
  useEffect(() => {
    function onEvent(value) {
      setWsData(value)
    }
    socket.on('last', onEvent);
    return () => {
      socket.off('last', onEvent);
    }
  })

  return (
    <>
      {/* <AppProvider>
        <AppHeader />
        <AppFooter />
      </AppProvider> */}

      <NavbarTop />
      <Logo />
      <UltimoRegistroTop />
      <div>{wsData}</div>
      <DadosPrincipais />
      <DadosAvancados/>
      <Graficos/>
      <GraficoChuvas/>
      <DiasSemChuva/>
      <Previsao/>
      <FooterBottom data={ip} />
    </>
  )
}

export default App
