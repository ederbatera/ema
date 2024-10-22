
"use client"

import { useState } from "react"

import { Calendar } from "@/components/ui/calendar"

const MetricasDia = () => {
  const [date, setDate] = useState(new Date())

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className=""
    />
  )
}

export default MetricasDia