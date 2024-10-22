
"use client"

import { useState } from "react"

import { Calendar } from "@/components/ui/calendar"
// import Loader from "../../loader/Loader"

const MetricasDia = () => {
  const [date, setDate] = useState(false)

  return (
    <div>
      <Calendar
        mode="single"
        // selected={date}
        onSelect={setDate}
        className="bg-transparent text-blue-gray-900 dark:text-blue-gray-100"
        
      />
      {/* <Loader/> */}
      <div>{date && date.toDateString()}</div>
    </div>
  )
}

export default MetricasDia