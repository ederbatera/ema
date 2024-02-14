//import { Container } from 'react-bootstrap';

import Temperatura from '../../public/imagens/temperatura.ico'
import Umidade from '../../public/imagens/umidade.ico'
import Pressao from '../../public/imagens/pressao.ico'
import Vento from '../../public/imagens/vento.ico'

const DadosPrincipais = () => {

  return (

    <>
      <div className="row">
        <div className="col-sm-6">
          <div className="card bg-light mb-3 shadow-lg rounded text-center">
            <h5 className="card-header"><img src={Temperatura}></img>Temperatura</h5>
            <div className="card-body">
              <div className="fs-1 fw-normal card-title text-primary" id="tempAtual">
                <div className="fs-3 spinner-grow text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <div className="vstack gap-3 col-sm-auto col-md-6 col-lg-6 col-xl-3 mx-auto">
                <span className="badge rounded-pill bg-light border border-info shadow-lg text-dark fw-normal">
                  <div className="card-text text-center"><span id="tempMin">Loading</span></div>
                  <div className="card-text text-center"><span id="tempMax">Loading</span></div>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card bg-light mb-3 shadow-lg rounded text-center">
            <h5 className="card-header"><img src={Umidade}></img>Umidade</h5>
            <div className="card-body">
              <div className="fs-1 fw-normal card-title text-primary" id="umiAtual">
                <div className="spinner-grow text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <div className="vstack gap-3 col-sm-auto col-md-6 col-lg-6 col-xl-3 mx-auto">
                <span className="badge rounded-pill bg-light border border-info shadow-lg text-dark fw-normal">
                  <div className="text-center"><span id="umiMin">Loading</span></div>
                  <div className="text-center"><span id="umiMax">Loading</span></div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-6">
          <div className="card bg-light mb-3 shadow-lg rounded text-center">
            <h5 className="card-header"><img src={Pressao}></img>Pressão</h5>
            <div className="card-body">
              <div className="fs-1 fw-normal card-title text-primary" id="pressAtual">
                <div className="spinner-grow text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <div className="vstack gap-3 col-sm-auto col-md-6 col-lg-6 col-xl-3 mx-auto">
                <span className="badge rounded-pill bg-light border border-info shadow-lg text-dark fw-normal">
                  <div className="card-text text-center"><span id="pressMin">Loading</span></div>
                  <div className="card-text text-center"><span id="pressMax">Loading</span></div>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card bg-light mb-3 shadow-lg rounded text-center">
            <h5 className="card-header"><img src={Vento}></img>Vento</h5>
            <div className="card-body">
              <div className="fs-1 fw-normal card-title text-primary" id="ventoAtual">
                <div className="spinner-grow text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <div className="vstack gap-3 col-sm-auto col-md-6 col-lg-6 col-xl-3 mx-auto">
                <span className="badge rounded-pill bg-light border border-info shadow-lg text-dark fw-normal">
                  <div className="row justify-content-center"><span className="col-auto" id="windDir">Loading</span> </div>
                  <div className="row justify-content-center"><span className="col-auto" id="windRaj">Loading</span></div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default DadosPrincipais;