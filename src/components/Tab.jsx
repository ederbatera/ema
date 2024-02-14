import React from 'react'
import { Button, Navbar, Nav, Tab, Tabs, Alert, Container, NavDropdown } from 'react-bootstrap/';

function Tab() {
  return (
    <Container>        
    <Tabs
      defaultActiveKey="profile" id="fill-tab-example" className="mb-3 nav-dark" fill >
      <Tab eventKey="home" title="Home">
        Tab content for Home
      </Tab>
      <Tab eventKey="profile" title="Profile">
        Tab content for Profile
      </Tab>
      <Tab eventKey="longer-tab" title="Loooonger Tab">
        Tab content for Loooonger Tab
      </Tab>
      <Tab eventKey="contact" title="Contact" disabled>
        Tab content for Contact
      </Tab>
    </Tabs>

    <Alert dismissible variant="danger">
      <Alert.Heading>Oh snap! You got an error!</Alert.Heading>
      <p>Change this and that and try again.</p>
    </Alert>
  
  </Container>
  )
}

export default Tab