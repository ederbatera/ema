"use client"

import { TrendingUp } from "lucide-react"
import { CartesianGrid, Area, AreaChart, XAxis, YAxis, Brush } from "recharts"

import useWindowDimensions from "../../../functions/useWindowDimensions"

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
  //ChartLegend,
  //ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// import { useGraficos } from "../../graficos/useGraficos.js"

export const description = "A line chart with dots"

const chartConfig = {
  Temperatura: {
    label: "Temperatura",
    color: "red",
  }
} satisfies ChartConfig

// eslint-disable-next-line react/prop-types
export function GraficoTemp({  dataDay }) {

    console.log(dataDay)
//   const { dataDay } = useGraficos()
//   const { width } = useWindowDimensions();

  return (
    <Card className="mb-10 rounded-xl
      bg-gray-300 text-gray-800 shadow-lg shadow-gray-800
      dark:bg-black border-0 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
      <CardHeader>
        <CardTitle>Temperatura</CardTitle>
        {/* <CardDescription>{new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</CardDescription> */}
        <CardDescription>Últimas 24 horas.</CardDescription>

      </CardHeader>
      <CardContent>
        <ChartContainer className="h-64 w-full" config={chartConfig}>
          <AreaChart 
            accessibilityLayer
            data={dataDay}
            margin={{
              left: 0,
              right: 0,
            }}
            height={100}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="data"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
              tickFormatter={(value) => value.slice(11, 16)}
            />
            <YAxis
            // domain={[0 , 50]}
            axisLine={false}
            tickLine={false}

            />
            <ChartTooltip
              className=" dark:bg-blue-gray-900 dark:text-white dark:border-0"
              cursor={true}
              content={<ChartTooltipContent />}
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }}
            />

            <defs>
              <linearGradient id="fillTemperatura" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-Temperatura)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-Temperatura)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
              {/* {width > 720 && (<Brush dataKey="name" height={20} stroke="var(--color-Temperatura)" />)} */}
            
            <Area
              dataKey="Temperatura"
              type="natural"
              stroke="var(--color-Temperatura)"
              // fill="red"
              fill="url(#fillTemperatura)"
              // fillOpacity={0.2}
              strokeWidth={0.5}
              dot={false}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Gráfico de Temperatura das últimas 24 horas. <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Registros à cada 5 minutos.
        </div>
      </CardFooter>
    </Card>
  )
}
