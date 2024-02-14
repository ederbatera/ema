import React from 'react'
import GraficoChuvaDia from './GraficoChuvaDia'

const Graficos = () => {
    return (
        <div className="row text-center">
            <div className="col-sm-12">
                <div className="card bg-light mb-3 shadow rounded">
                    <h5 className="card-header" id="headerGraficos"></h5>
                    <div className="card-body">
                        <GraficoChuvaDia/>
                        <div id="grafico_temperatura">Loadinf</div>
                        <div id="grafico_umidade">Loading</div>
                        <div id="grafico_pressao">Loading</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Graficos