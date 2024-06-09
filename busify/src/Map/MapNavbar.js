import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

function MapNavbar() {
    return (
        <Navbar className="bg-body-tertiary">
            <Container fluid>
                <Navbar.Brand href="/">Busify</Navbar.Brand>
                <Navbar.Toggle />
                <Nav className="justify-content-end">
                    <Nav.Link href="/"> Acasă </Nav.Link>
                    <Nav.Link href="/"> Contact </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default MapNavbar;