"use client"

import { getRainSevenDays } from "../../../api/Gets"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import { useContext } from "react"
import { GlobalContext } from "../../../context/GlobalContext"
import { color } from "framer-motion"

export const description = "A bar chart with a label"


const chartConfig = {
  chuva: {
    label: "Chuva",
    // color: "hsl(var(--chart-1))",
    // color: ""
  },
} satisfies ChartConfig


export function GraficoChuvas() {

  const { rainSevenDays } = useContext(GlobalContext)

  const chuvaSeteDias = parseFloat(rainSevenDays[9].sete_dias)
  const chuvaMes = parseFloat(rainSevenDays[7].mon)
  const chuvaHoje = parseFloat(rainSevenDays[0].rain)
  const chuvaCincoMin = parseFloat(rainSevenDays[8].cinco_min)
  const ultimaChuva = rainSevenDays[10].ultima_chuva

  const chartData = [

    { day: rainSevenDays[6].day, chuva: rainSevenDays[6].rain },
    { day: rainSevenDays[5].day, chuva: rainSevenDays[5].rain },
    { day: rainSevenDays[4].day, chuva: rainSevenDays[4].rain },
    { day: rainSevenDays[3].day, chuva: rainSevenDays[3].rain },
    { day: rainSevenDays[2].day, chuva: rainSevenDays[2].rain },
    { day: rainSevenDays[1].day, chuva: rainSevenDays[1].rain },
    { day: rainSevenDays[0].day, chuva: chuvaHoje },
  ]

  const chartData2 = [
    { acumulado: "Mês", chuva: chuvaMes },
    { acumulado: "7 dias", chuva: chuvaSeteDias },
    { acumulado: "Hoje", chuva: chuvaHoje },
    { acumulado: "5 minutos", chuva: chuvaCincoMin },
  ]

  return (
    rainSevenDays[0]?.day ?
      (
        <Card className="max-w-screen-xl w-full rounded-xl
      bg-gray-300 text-gray-800 shadow-lg shadow-gray-800
      dark:bg-black border-0 dark:text-blue-gray-200 dark:shadow-blue-gray-900">

          {chuvaSeteDias > 0 ? (
            <span>
              <CardHeader>
                <CardTitle>Precipitação em mm/m³</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-64 w-full" config={chartConfig}>
                  <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      top: 20,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="day"
                      tickLine={true}
                      tickMargin={10}
                      axisLine={false}
                    // tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                      className=" dark:bg-blue-gray-900 dark:text-white dark:border-0"
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="chuva"
                      // fill="var(--color-chuva)"
                      className="opacity-90
                          fill-cyan-800 
                          dark:fill-cyan-500"
                      radius={8}>
                      <LabelList
                        position="top"
                        offset={12}
                        formatter={(data) => data + " mm"}
                        className="
                            fill-gray-800
                            dark:fill-blue-gray-200"
                        fontSize={14}
                      />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                  Gráfico de Chuvas dos últimos 7 dias <TrendingUp className="h-4 w-4" />
                </div>
                {/* <div className="leading-none text-muted-foreground">
                      Acumulado nos 7 dias: {rainSevenDays[9].sete_dias} mm
                    </div> */}
              </CardFooter>

              <div className="mx-10 border-0 border-b
                                border-gray-400 
                                dark:border-blue-gray-800">

              </div>
            </span>
          ) : ""}


          <CardHeader>
            {chuvaSeteDias == 0 ? (
              <CardTitle>Precipitação em mm/m³</CardTitle>
            ) : ""}
            <CardDescription>Acumulados</CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer className="h-40 w-full" config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={chartData2}
                layout="vertical"
                margin={{
                  // right: 16,
                  left: 16
                }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="acumulado"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                // tickFormatter={(value) => value.slice(0, 3)}
                // hide
                />
                <XAxis
                  dataKey="chuva"
                  type="number"
                />
                <ChartTooltip
                  className=" dark:bg-blue-gray-900 dark:text-white dark:border-0"
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="chuva"
                  layout="vertical"
                  // fill="var(--color-chuva)"
                  // fill="hsl(var(--chart-2))"
                  className="opacity-90
                  fill-cyan-800 
                  dark:fill-cyan-500"
                  radius={4}
                >
                  {/* <LabelList
                    dataKey="acumulado"
                    position="insideLeft"
                    // position="left"
                    offset={8}
                    // className="fill-[--color-label]"
                    className="
                    fill-gray-800
                    dark:fill-blue-gray-50"
                    fontSize={12}
                  /> */}
                  <LabelList
                    dataKey="chuva"
                    formatter={(data) => data + " mm"}
                    position="right"
                    offset={8}
                    // className="fill-foreground"
                    className="
                    fill-gray-800
                    dark:fill-blue-gray-200"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              Gráfico de acumulados <TrendingUp className="h-4 w-4" />
            </div>
            {chuvaSeteDias == 0 ? (
              <div className="leading-none text-muted-foreground">
                {ultimaChuva.dias} dias sem chuva.
                Última chuva foi de {ultimaChuva.value}mm em {ultimaChuva.date}
              </div>
            ) : ""}
          </CardFooter>

        </Card>

      )
      :
      (<div>Carregando...</div>)

  )
}
