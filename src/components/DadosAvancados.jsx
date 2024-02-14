import React from 'react'

const DadosAvancados = () => {
    return (

        <div className="row">
            <div className="col-sm-12">
                <div className="card bg-light mb-3 shadow rounded">
                    <h5 className="card-header text-center">Dados metereológicos avançados</h5>
                    <div className="card-body text-body">
                        <div className="row">
                            <div className="col-6 border-end">
                                
                                    <div className="row">
                                        <div className="col text-end">Umi. relativa do ar:</div>
                                        <div className="col text-primary text-start" id="avancadosUmiRelativa">Loading</div>
                                    </div>
                                    <div className="row">
                                        <div className="col text-end">Umi. absoluta do ar:</div>
                                        <div className="col text-primary text-start" id="avancadosUmiAbsoluta">Loading</div>
                                    </div>
                                
                            </div>

                            <div className="col-6">
                                
                                    <div className="row">
                                        <div className="col text-end">Sensação térmica:</div>
                                        <div className="col text-primary text-start" id="avancadosSensacao">Loading</div>
                                    </div>
                                    <div className="row">
                                        <div className="col text-end">Ponto de orvalho:</div>
                                        <div className="col text-primary text-start" id="avancadosPontoOrvalho">Loading</div>
                                    </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    )
}

export default DadosAvancados