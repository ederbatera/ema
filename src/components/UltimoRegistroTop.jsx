

const UltimoRegistroTop = ( props ) => {
    const data = props.data

  return (
        <div className="container">
        <div className="row justify-content-center">
          <div className="col-auto">
            {/* <span className="lead text-center" id="ultimoRegistroTop">Última leitura de dados: Segunda-Feira, 12 de Fevereiro de 2024 às 19:00</span> */}
            <span className="lead text-center" id="ultimoRegistroTop">Última leitura de dados: {data.HORA} - {data.timestamp} </span>
            <span id="attAtivada" data-tooltip="Atualização em tempo real"><span className="spinner-grow spinner-grow-sm text-success" role="status"></span></span>
          </div>
        </div>
   </div>
    )

}

export default UltimoRegistroTop