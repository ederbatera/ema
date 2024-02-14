import React, { Component } from 'react'

export class Logo extends Component {
  render() {
    return (
        <div
        style={{
          display: 'grid',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div><img src='../public/imagens/logo.png'></img></div>
        <div className="fs-1 fw-light"> Estação Meteorológica Agudos/SP  </div>
        <div>
          <i className="fas fa-map-marker-alt"></i>
          <a className="text-muted text-center align-baseline text-decoration-none" target="_blank" href="https://goo.gl/maps/JKA4JvaFzZFCr5Sn7"> Lat: -22.467009° - Long: -48.973334° Altitude: 618m</a>
        </div>
      </div>
    )
  }
}

export default Logo