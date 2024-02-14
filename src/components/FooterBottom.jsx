

const FooterBottom = (props) => {

    return (
        <div className="card rounded-0 text-bg-dark text-center">
            <div className="card-header">
                <div className="lead text-warning align-bottom">
                    <span className="align-bottom">Seu </span>
                    <span className="align-bottom">
                        <a href="https://www.nic.br/" className="text-decoration-none badge badge-pill bg-success position-relative">
                            IP
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">v4</span>
                        </a>
                    </span>
                    <span className="align-bottom ps-2 pe-1">é:</span>
                    <span className="align-bottom text-danger">{ props.data }</span>
                </div>
            </div>
            <div className="card-body">
                <div className="fs-5 fw-normal lh-sm">&copy;2024 EMA - Estação Metereológica Agudos/SP</div>
                <a className="fs-6 fw-light lh-sm text-decoration-none text-white-50" href='https://www.facebook.com/emaagudos' target="_blank"><i className="fab fa-facebook"></i> facebook.com/emaagudos</a>
            </div>
        </div>
    )
}

export default FooterBottom;