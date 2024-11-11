"use client"
import React from "react"
import { TrendingUp } from "lucide-react"
import { CartesianGrid, Area, AreaChart, XAxis, YAxis, Brush } from "recharts"

import useWindowDimensions from "../../../functions/useWindowDimensions"

import { format } from "date-fns";

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
  Chuva: {
    label: "Chuva",
    color: "blue",
  },
  Temperatura: {
    label: "Temperatura",
    color: "red",
  },
  Umidade: {
    label: "Umidade",
    color: "purple",
  },
  Pressão: {
    label: "Pressão",
    color: "gray",
  }
} satisfies ChartConfig


// eslint-disable-next-line react/prop-types
export function Grafico({ dataDay, label, maxMin }) {


  const useGraficos = (dataGraphics) => {
    const dataGrafico = dataGraphics.map(item => ({
      data: item.data,
      Temperatura: item.temp_atual,
      Umidade: item.umi_atual,
      Pressão: parseInt(item.p_atm),
      Chuva: item.chuva_5min
    }));
    return dataGrafico

  }

  const dataGraph = useGraficos(dataDay)

  let scaleGraph

  switch (label) {
    case 'Temperatura':
      scaleGraph = [parseInt(maxMin.minTemp.value) - 1, parseInt(maxMin.maxTemp.value) + 1]
      break;

    case 'Umidade':
      scaleGraph = [parseInt(maxMin.minUmi.value) - 1, parseInt(maxMin.maxUmi.value) + 1]
      break;

    case 'Pressão':
      scaleGraph = [parseInt(maxMin.minPress.value) - 1, parseInt(maxMin.maxPress.value) + 1]
      break;

    default:
      scaleGraph = [,]
      break;
  }

  return (
    <section className="max-w-screen-xl w-full pb-6">
      <Card className="rounded-xl
      bg-gray-300 text-gray-800 shadow-lg shadow-gray-800
      dark:bg-black border-0 dark:text-blue-gray-200 dark:shadow-blue-gray-900">
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <CardDescription>{dataGraph ? `Dia ${format(dataGraph[dataGraph.length - 1].data, "dd/MM/yy")}` : "-"}</CardDescription>

        </CardHeader>
        <CardContent>
          <ChartContainer className="h-64 w-full" config={chartConfig}>
            <AreaChart
              accessibilityLayer
              data={dataGraph}
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
                type="number"
                domain={scaleGraph}
                // domain={[(v) => v - 1, (v) => v + 1]}
                // domain={
                //   [
                //     (v) => {
                //       return v - 1
                //     }, 
                //     (v) => {
                //       console.log(v)
                //       return v + 1
                //     }
                //   ]
                // }
                // domain={([dataMin, dataMax]) => { return [(dataMin - 1), (dataMax + 1)]; }} 
                allowDataOverflow
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
                <linearGradient id={`fill${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${label})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${label})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey={label}
                type="natural"
                stroke={`var(--color-${label})`}
                // fill="red"
                fill={`url(#fill${label})`}
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
            Gráfico de {label.toLowerCase()}. <TrendingUp className="h-4 w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Registros à cada 5 minutos.
          </div>
        </CardFooter>
      </Card>
    </section>
  )
}
