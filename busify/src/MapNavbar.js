import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { useEffect, useRef, useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Squash as Hamburger } from 'hamburger-react';
import Badge from 'react-bootstrap/Badge';
import { useNavigate } from 'react-router';

function MapNavbar() {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const [expandedLines, setExpandedLines] = useState([])
    const expandedLinesRef = useRef([])
    const vineriRef = useRef(false)

    const [expandedLinesFav, setExpandedLinesFav] = useState([])
    const expandedLinesFavRef = useRef([])

    const [anuntState, setAnunt] = useState([]);

    const nav = useNavigate();

    const fetchData = async () => {
        try {
            const data = await fetch('https://orare.busify.ro/public/buses_basic.json')
            const resp = await data.json()
            resp.urbane.forEach(elem => expandedLinesRef.current.push(elem.name))
            resp.metropolitane.forEach(elem => expandedLinesRef.current.push(elem.name))
            resp.market.forEach(elem => expandedLinesRef.current.push(elem.name))

            const anuntData = await fetch('https://busifybackend-40a76006141a.herokuapp.com/anunturi');
            const anunt = await anuntData.json();
            const date = Date.parse(anunt.end_date);
            if(date > new Date())
                setAnunt(anunt);
        } catch (e) { console.log(e) }
    }
    useEffect(() => {
        if (expandedLinesRef.current.length === 0)
            fetchData()
        const d = new Date();
        if(d.getDay() === 5)
            vineriRef.current = true
    }, [])

    return (
        <Navbar className="bg-body-tertiary">
            <Container fluid>
                <Navbar.Brand style={{ 'paddingLeft': 5 }}>
                <a href='/' style={{color: 'black', textDecoration: 'none'}}>Busify</a>
                <Badge style={{
                    marginLeft: 5,
                    display: vineriRef.current ? "initial" : "none"
                }} bg="success">Vinerea Verde</Badge>
                <Badge style={{
                    marginLeft: 5,
                    cursor: 'pointer',
                    display: anuntState.anunt ? "initial" : "none"}} bg="danger" onClick={()=>{nav('/orare')}}>Orar modificat</Badge>
                </Navbar.Brand>
                <Navbar.Toggle />
                <Nav className="justify-content-end">
                    <Hamburger toggle={setShow} onToggle={ () => {
                        if(localStorage.getItem('linii_favorite') !== null){
                            const liniiFavLocalStorage = localStorage.getItem('linii_favorite')
                            expandedLinesFavRef.current = liniiFavLocalStorage.split(/,| /)
                            expandedLinesFavRef.current.pop()
                            console.log(expandedLinesFavRef.current)
                        }
                    }} />
                    <Offcanvas show={show} onHide={handleClose} placement='start'>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>
                                <Nav.Link href="/" style={{ paddingBottom: '10px' }}> Busify </Nav.Link>
                            </Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav.Link href="https://busify.ro/" style={{ paddingBottom: '10px' }}> Acasă </Nav.Link>
                            <Nav.Link href="/map" style={{ paddingBottom: '10px' }}> Hartă </Nav.Link>
                            <Nav.Link href='/map/undemiibusu' style={{ paddingBottom: '10px' }}> Unde mi-i busu'? </Nav.Link>
                            <Nav.Link href="/map/destinatii" style={{ paddingBottom: '10px' }}> Destinații </Nav.Link>
                            <Nav.Link href="/orare" style={{ paddingBottom: '10px' }}> Orare </Nav.Link>
                            <div style={{
                                flexDirection: 'row',
                                display: 'flex'
                            }} onClick={() => {
                                if (expandedLinesFav.length > 0)
                                    setExpandedLinesFav([])
                                else setExpandedLinesFav(expandedLinesFavRef.current)
                            }}>
                                <Nav.Link style={{ paddingBottom: '10px' }}> Linii favorite </Nav.Link>
                                <img width='15px' height='15px' style={{
                                    margin: '5px',
                                    rotate: expandedLinesFav.length > 0 ? '0deg' : '-90deg'
                                }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO3UPUpDQRTF8V8sHikCNoL2WYBVSq3cgqVttuAW3EPK9IJFymgTIRZZg42NgqUIIhoeTCHDy3ujmRTC/OE0wz3nMl+XQqFQyMQtVhjmCgxZK8zbir6DXnGWoekpXn7kdjau9YnLLZqO8RFlbmQZFdaaoJJOFTxxzrLNNMB1g+keRwlND3DX4J9hv8vcC0f8FZmfMGrxHeMx8tQZV9jzC87xFgW942LL2iS6dvHX00niEIuGe7sJitcXwZOFasNLjTVF3w4YN/zNHH8+iRM872DKJc/fh6Ccc71QKPwj1j8gazJLnl+5AAAAAElFTkSuQmCC"></img>
                            </div>
                            {expandedLinesFav.map(elem => (
                                <p>
                                    {elem} - <a href={'/orare/' + elem}>orar</a> / <a href={'/map/' + elem}>hartă</a>
                                </p>
                            ))}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row'
                            }} onClick={() => {
                                if (expandedLines.length > 0)
                                    setExpandedLines([])
                                else setExpandedLines(expandedLinesRef.current)
                            }}>
                                <Nav.Link style={{ paddingBottom: '10px' }}> Linii </Nav.Link>
                                <img width='15px' height='15px' style={{
                                    margin: '5px',
                                    rotate: expandedLines.length > 0 ? '0deg' : '-90deg'
                                }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO3UPUpDQRTF8V8sHikCNoL2WYBVSq3cgqVttuAW3EPK9IJFymgTIRZZg42NgqUIIhoeTCHDy3ujmRTC/OE0wz3nMl+XQqFQyMQtVhjmCgxZK8zbir6DXnGWoekpXn7kdjau9YnLLZqO8RFlbmQZFdaaoJJOFTxxzrLNNMB1g+keRwlND3DX4J9hv8vcC0f8FZmfMGrxHeMx8tQZV9jzC87xFgW942LL2iS6dvHX00niEIuGe7sJitcXwZOFasNLjTVF3w4YN/zNHH8+iRM872DKJc/fh6Ccc71QKPwj1j8gazJLnl+5AAAAAElFTkSuQmCC"></img>
                            </div>
                            {expandedLines.map(elem => (
                                <p>
                                    {elem} - <a href={'/orare/' + elem}>orar</a> / <a href={'/map/' + elem}>hartă</a>
                                </p>
                            ))}
                            <Nav.Link href="/orare" style={{ paddingBottom: '10px' }}> Ultimele știri </Nav.Link>
                            <Nav.Link href="https://busify.ro/contact"> Contact </Nav.Link>
                        </Offcanvas.Body>
                    </Offcanvas>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default MapNavbar;