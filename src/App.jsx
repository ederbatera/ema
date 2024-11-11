import { useEffect, useState } from "react";
// import AlertsTop from "./components/AlertsTop";
import NavMenu from "./components/NavMenu";
import { GlobalContext } from "./context/GlobalContext";
import AppRoutes from "./Routes"
import { getMaxMinDay, getAllDay, getDataGraphics, getRainSevenDays, getWeather } from "./api/Gets";
import socket from "./services/socket"
import Chuva from "./components/Chuva";
import { motion, useScroll, useSpring } from "framer-motion";




// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeProvider } from "@/components/theme-provider"
import Footer from "./components/footer/Footer";
import { CiLocationOn } from "react-icons/ci";
import LoaderFull from "./components/loader/LoaderFull";
// import Raios from "./components/raios/Raios";


function App() {


  const [dataDay, setDataDay] = useState([])
  const [dataGraphics, setDataGraphics] = useState([])
  const [currentValues, setCurrentValues] = useState({})
  const [maxMinDay, setMaxMinDay] = useState({})
  const [rainSevenDays, setRainSevenDays] = useState([])
  const [connected, setConnected] = useState(false)
  const [clientsConnected, setClientsConnected] = useState(0)
  const [weather, setWeather] = useState({})

  const fetchData = async () => {
    try {
      const dataDay = await getAllDay()
      const dataMaxMinDay = await getMaxMinDay()
      const dataGraphics = await getDataGraphics()
      const rainSevenDays = await getRainSevenDays()
      const dataWeather = await getWeather()

      setDataDay(dataDay);
      setCurrentValues(dataDay[dataDay.length - 1])
      setMaxMinDay(dataMaxMinDay)
      setDataGraphics(dataGraphics)
      setRainSevenDays(rainSevenDays)
      setWeather(dataWeather)
    } catch (error) {
      console.error("Erro ao buscar dados: ", error);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    checkMaxMinDay(currentValues)
  }, [currentValues]);


  useEffect(() => {

    // socket.onAny((event, ...args) => {
    //   console.log(`Evento recebido: ${event}`);
    //   console.log('Dados:', args);
    // });

    socket.on('last_data', data => {
      setCurrentValues(data)
      setDataDay((current) => [...current, data])
      setDataGraphics((current) => [...current.slice(1), data])

    })

    socket.on('weather', data => {
      setWeather(data)
    })

    socket.on('chuva_7_days', data => {
      setRainSevenDays(data)
    })

    socket.on('connections_count', data => {
      // console.log("Clientes conectados: ", data)
      setClientsConnected(data)
    })

    socket.on("connect", () => {
      setConnected(socket.connected)
      // console.log("Connected:",socket.connected)
      // console.log(`Websocket ID: ${socket.id}`); // x8WIv7-mJelg7on_ALbx
    });

    socket.on("disconnect", () => {
      setConnected(socket.connected)
      // console.log("Connected:",socket.connected)
    });

    // return () => socket.off('update_data')
    return () => socket.off()
  }, [connected])


  /* Funções de Manipulação */

  function checkMaxMinDay(newValues) {
    if (newValues.temp_atual < maxMinDay.minTemp?.value) {
      const minTemp = {
        value: newValues.temp_atual,
        date: newValues.data
      }
      setMaxMinDay(prev => { return { ...prev, minTemp: minTemp } })
    }

    if (newValues.temp_atual > maxMinDay.maxTemp?.value) {
      const maxTemp = {
        value: newValues.temp_atual,
        date: newValues.data
      }
      setMaxMinDay(prev => { return { ...prev, maxTemp: maxTemp } })
    }

    if (newValues.umi_atual < maxMinDay.minUmi?.value) {
      const minUmi = {
        value: newValues.umi_atual,
        date: newValues.data
      }
      setMaxMinDay(prev => { return { ...prev, minUmi: minUmi } })
    }

    if (newValues.umi_atual > maxMinDay.maxUmi?.value) {
      const maxUmi = {
        value: newValues.umi_atual,
        date: newValues.data
      }
      setMaxMinDay(prev => { return { ...prev, maxUmi: maxUmi } })
    }

    if (newValues.p_atm < maxMinDay.minPress?.value) {
      const minPress = {
        value: newValues.p_atm,
        date: newValues.data
      }
      setMaxMinDay(prev => { return { ...prev, minPress: minPress } })
    }

    if (newValues.p_atm >= maxMinDay.maxPress?.value) {
      const maxPress = {
        value: newValues.p_atm,
        date: newValues.data
      }
      setMaxMinDay(prev => { return { ...prev, maxPress: maxPress } })
    }
  }



  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress)

  return (
    <GlobalContext.Provider
      value={{
        dataDay, setDataDay,
        dataGraphics, setDataGraphics,
        currentValues, setCurrentValues,
        maxMinDay, setMaxMinDay,
        clientsConnected, socket, connected,
        rainSevenDays,
        weather
      }}>
      {currentValues.registro ? (

        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">

          <Chuva />
          {/* <Raios/> */}
          <section className="min-h-screen
                          bg-blue-gray-100 
                          dark:bg-black dark:bg-opacity-90">
            <motion.div className="progress-bar z-20" style={{ scaleX }} />
            <NavMenu />
            <div className="text-center text-xs flex flex-col md:flex-row justify-between gap-x-5 mt-1 w-full max-w-screen-xl mx-auto p-2
                        text-gray-600
                        dark:text-gray-700">
              <div className="">
                Estação Meteorológica Agudos/SP
              </div>
              <div className="flex flex-row justify-center">
                <CiLocationOn size={15} /> -22.467009° -48.973334° | Altitude: 618m
              </div>
            </div>
            {/* <Home/> */}
            <AppRoutes />
          </section>
          <Footer />

        </ThemeProvider>

      ) : (
        <LoaderFull />
      )}
    </GlobalContext.Provider>
  )
}

export default App




