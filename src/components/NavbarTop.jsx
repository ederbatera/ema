import React from 'react'
import { Button, Navbar, Nav, Tab, Tabs, Alert, Container, NavDropdown } from 'react-bootstrap/';
function NavbarTop() {
    return (
        <Navbar className='bg-dark sticky-top shadow-lg px-2 h5' data-bs-theme="dark">
            <Nav className="me-auto">
                <Navbar.Brand href="#home">Início</Navbar.Brand>
                <Nav.Link href="#home">Sobre</Nav.Link>
                <Nav.Link href="#link">Registros Históricos</Nav.Link>
                <NavDropdown title="Consultas" id="basic-nav-dropdown" data-bs-theme="dark">
                    <NavDropdown.Item href="#action/3.1">&bull; Métricas Dia</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">&bull; Métricas Mês</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">&bull; Métricas Ano</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">&bull; Métricas Chuva Mês</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#action/3.4">&bull; Busca detalhada por data</NavDropdown.Item>
                </NavDropdown>
            </Nav>
            <Button className='shadow rounded' variant="outline-warning">Área restrita</Button>
        </Navbar>
    )
}

export default NavbarTop