import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

function MapNavbar() {
    return (
        <Navbar className="bg-body-tertiary">
            <Container fluid>
                <Navbar.Brand href="/" style={{ 'paddingLeft': 10 }}>Busify</Navbar.Brand>
                <Navbar.Toggle />
                <Nav className="justify-content-end">
                    <Nav.Link href="/map"> Hartă </Nav.Link>
                    <Nav.Link href="/orare"> Orare </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default MapNavbar;