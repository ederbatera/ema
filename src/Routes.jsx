import { Routes, Route } from "react-router-dom"

import Home from "./components/home";
import MetricasDia from "./components/metricas/dia/MetricasDia";

export default function AppRoutes() {
	return (
		
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/metricas-dia" element={<MetricasDia />} />
			</Routes>
		
	)
}
