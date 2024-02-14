
const GraficoChuvas = () => {
    return (
        <div className="row" id="graficoChuvasDisplay">
            <div className="col-sm-12 col-xs-12">
                <div className="card bg-light mb-3 shadow rounded">
                    <h5 className="card-header"> Precipitação em mm</h5>
                    <div className="card-body">
                        <div id="grafico_chuva_sete_dias"></div>
                        <hr></hr>
                        <div id="barchart_values"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GraficoChuvas;