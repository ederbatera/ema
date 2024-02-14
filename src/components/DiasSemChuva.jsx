import React from 'react'

const DiasSemChuva = () => {
    return (
        <div className="row text-center" id="diasSemchuvaDisplay">
            <div className="col-sm-12 col-xs-12">
                <div className="card bg-light mb-3 shadow rounded">
                    <h5 className="card-header"><img src="../public/imagens/chuva_2.ico"></img></h5>
                    <div className="card-body">
                        <div className="text-warning display-4" id="diasSemchuvaValue">10</div>
                        <div className="text-muted h5 ">Dias sem chuva</div>
                    </div>
                    <div className="card-text mb-3" id="ultimaChuvaValue"></div>
                </div>
            </div>
        </div>
    )
}

export default DiasSemChuva
