import React from 'react'

const Previsao = () => {
    return (
        <>
            <div className='text-center' id="previsao">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="card bg-light shadow rounded">
                            <h5 className="card-header">Previsão para os próximos 7 dias</h5>
                            <div className="card-body text-body mb-4">
                                <div className="row justify-content-center my-2" id="colun_prev">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <blockquote className="blockquote text-end mr-3 mt-3">
                <footer className="blockquote-footer"> <a href="https://advisor.climatempo.com.br/" className="alert-link text-decoration-none">Climatempo</a>, <cite title="Título da fonte">Advisor</cite></footer>
            </blockquote>
        </>
    )
}

export default Previsao