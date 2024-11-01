import { Routes, Route } from "react-router-dom"

import Home from "./components/home";
import MetricasDia from "./components/metricas/dia/MetricasDia";
import MetricasMes from "./components/metricas/mes/MetricasMes";
import MetricasAno from "./components/metricas/ano/MetricasAno";
import MetricasChuva from "./components/metricas/chuva/MetricasChuva";
import DadosHistoricos from "./components/historicos/index";

export default function AppRoutes() {
	return (
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/metricas-dia" element={<MetricasDia />} />
				<Route path="/metricas-mes" element={<MetricasMes />} />
				<Route path="/metricas-ano" element={<MetricasAno />} />
				<Route path="/metricas-chuva" element={<MetricasChuva />} />
				<Route path="/dados-historicos" element={<DadosHistoricos />} />
			</Routes>

	)
}
 