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

    const [expandedMap, setExpandedMap] = useState(false)
    const [expandedOrare, setExpandedOrare] = useState(false)

    const nav = useNavigate();

    const fetchData = async () => {
        try {
            const data = await fetch('https://orare.busify.ro/public/buses_basic.json')
            const resp = await data.json()
            resp.urbane.forEach(elem => expandedLinesRef.current.push(elem.name))
            resp.metropolitane.forEach(elem => expandedLinesRef.current.push(elem.name))
            resp.market.forEach(elem => expandedLinesRef.current.push(elem.name))

            const anuntData = await fetch('https://busifyserver.onrender.com');
            const anunt = await anuntData.json();

            const endDateParts = anunt.end_date.split("/");
            const endDate = new Date(+endDateParts[2], endDateParts[1] - 1, +endDateParts[0]);

            const startDateParts = anunt.start_date.split("/");
            const startDate = new Date(+startDateParts[2], startDateParts[1] - 1, +startDateParts[0]);

            if(endDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && startDate.setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0))
                setAnunt(anunt);
        } catch (e) { console.log(e) }
    }

    function sortBusLines(busLines) {
        return busLines.sort((a, b) => {
            // Extract the numeric part and suffix using regex
            const parseLine = (line) => {
                const match = line.match(/^(\d+)([A-Z]*)$/);
                return [parseInt(match[1], 10), match[2] || ''];
            };

            const [numA, suffixA] = parseLine(a);
            const [numB, suffixB] = parseLine(b);

            // Compare numeric parts
            if (numA !== numB) {
                return numA - numB;
            }

            // Compare suffixes lexicographically
            return suffixA.localeCompare(suffixB);
        });
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
                <Navbar.Brand style={{ 'paddingLeft': 10, display: 'flex', alignItems: 'center'}}>
                <a href='/' style={{color: 'black', textDecoration: 'none'}}>Busify</a>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <Badge style={{
                        marginLeft: 10,
                        display: vineriRef.current ? "initial" : "none",
                        marginBottom: anuntState.anunt ? 5 : 0
                    }} bg="success">Vinerea Verde</Badge>
                    <Badge style={{
                        marginLeft: 10,
                        cursor: 'pointer',
                        display: anuntState.anunt ? "initial" : "none"}} bg="danger" onClick={()=>{nav('/orare')}}>Orar modificat</Badge>
                </div>
                </Navbar.Brand>
                <Navbar.Toggle />
                <Nav className="justify-content-end">
                    <Hamburger toggle={setShow} onToggle={ () => {
                        if(localStorage.getItem('linii_favorite') !== null){
                            const liniiFavLocalStorage = localStorage.getItem('linii_favorite')
                            expandedLinesFavRef.current = liniiFavLocalStorage.split(/,| /)
                            expandedLinesFavRef.current.pop()
                            expandedLinesFavRef.current = sortBusLines(expandedLinesFavRef.current)
                        }
                    }} />
                    <Offcanvas show={show} onHide={handleClose} placement='start'>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>
                                <Nav.Link href="/" style={{padding: '5px', paddingBottom: '10px' }}> Busify </Nav.Link>
                            </Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <div style={{
                                flexDirection: 'row',
                                display: 'flex',
                                padding: '5px',
                                paddingBottom: '10px',
                            }} onClick={() => {setExpandedMap(prev => {return !prev})}}>
                                <Nav.Link>Hartă live</Nav.Link>
                                <img width='15px' height='15px' style={{
                                    margin: '5px',
                                    rotate: expandedMap ? '0deg' : '-90deg'
                                }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO3UPUpDQRTF8V8sHikCNoL2WYBVSq3cgqVttuAW3EPK9IJFymgTIRZZg42NgqUIIhoeTCHDy3ujmRTC/OE0wz3nMl+XQqFQyMQtVhjmCgxZK8zbir6DXnGWoekpXn7kdjau9YnLLZqO8RFlbmQZFdaaoJJOFTxxzrLNNMB1g+keRwlND3DX4J9hv8vcC0f8FZmfMGrxHeMx8tQZV9jzC87xFgW942LL2iS6dvHX00niEIuGe7sJitcXwZOFasNLjTVF3w4YN/zNHH8+iRM872DKJc/fh6Ccc71QKPwj1j8gazJLnl+5AAAAAElFTkSuQmCC"></img>
                            </div>
                            <Nav.Link href="/map" style={{padding: '5px', paddingBottom: '10px', display: expandedMap ? 'flex' : 'none', paddingLeft: '30px' }}> Hartă </Nav.Link>
                            <Nav.Link href='/map/undemiibusu' style={{padding: '5px', paddingBottom: '10px', display: expandedMap ? 'flex' : 'none', paddingLeft: '30px' }}> Unde mi-i busu'? </Nav.Link>
                            <Nav.Link href="/map/destinatii" style={{padding: '5px', paddingBottom: '10px', display: expandedMap ? 'flex' : 'none', paddingLeft: '30px' }}> Destinații pas cu pas </Nav.Link>
                            <div style={{
                                flexDirection: 'row',
                                display: 'flex',
                                padding: '5px',
                                paddingBottom: '10px',
                            }}>
                                <Nav.Link href='/orare'>Orare</Nav.Link>
                                {/* <img width='15px' height='15px' style={{
                                    margin: '5px',
                                    rotate: expandedOrare ? '0deg' : '-90deg'
                                }} onClick={() => {setExpandedOrare(prev => {return !prev})}} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO3UPUpDQRTF8V8sHikCNoL2WYBVSq3cgqVttuAW3EPK9IJFymgTIRZZg42NgqUIIhoeTCHDy3ujmRTC/OE0wz3nMl+XQqFQyMQtVhjmCgxZK8zbir6DXnGWoekpXn7kdjau9YnLLZqO8RFlbmQZFdaaoJJOFTxxzrLNNMB1g+keRwlND3DX4J9hv8vcC0f8FZmfMGrxHeMx8tQZV9jzC87xFgW942LL2iS6dvHX00niEIuGe7sJitcXwZOFasNLjTVF3w4YN/zNHH8+iRM872DKJc/fh6Ccc71QKPwj1j8gazJLnl+5AAAAAElFTkSuQmCC"></img> */}
                            </div>
                            <Nav.Link href="/orare" style={{ padding: '5px', paddingBottom: '10px', display: expandedOrare ? 'flex' : 'none', paddingLeft: '30px'}}> Ultimele știri </Nav.Link>
                            <div style={{
                                padding: '5px',
                                paddingBottom: '10px',
                                flexDirection: 'row',
                                display: 'flex'
                            }} onClick={() => {
                                if (expandedLinesFav.length > 0)
                                    setExpandedLinesFav([])
                                else setExpandedLinesFav(expandedLinesFavRef.current)
                            }}>
                                <Nav.Link> Linii favorite </Nav.Link>
                                <img width='15px' height='15px' style={{
                                    margin: '5px',
                                    rotate: expandedLinesFav.length > 0 ? '0deg' : '-90deg'
                                }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO3UPUpDQRTF8V8sHikCNoL2WYBVSq3cgqVttuAW3EPK9IJFymgTIRZZg42NgqUIIhoeTCHDy3ujmRTC/OE0wz3nMl+XQqFQyMQtVhjmCgxZK8zbir6DXnGWoekpXn7kdjau9YnLLZqO8RFlbmQZFdaaoJJOFTxxzrLNNMB1g+keRwlND3DX4J9hv8vcC0f8FZmfMGrxHeMx8tQZV9jzC87xFgW942LL2iS6dvHX00niEIuGe7sJitcXwZOFasNLjTVF3w4YN/zNHH8+iRM872DKJc/fh6Ccc71QKPwj1j8gazJLnl+5AAAAAElFTkSuQmCC"></img>
                            </div>
                            {expandedLinesFav.map(elem => (
                                <p style={{paddingLeft: '30px'}}>
                                    {elem} - <a href={'/orare/' + elem}>orar</a> / <a href={`sms:7479&body=${elem}`}>bilet prin SMS</a>
                                </p>
                            ))}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                padding: '5px',
                                paddingBottom: '10px',
                            }} onClick={() => {
                                if (expandedLines.length > 0)
                                    setExpandedLines([])
                                else setExpandedLines(expandedLinesRef.current)
                            }}>
                                <Nav.Link> Toate liniile </Nav.Link>
                                <img width='15px' height='15px' style={{
                                    margin: '5px',
                                    rotate: expandedLines.length > 0 ? '0deg' : '-90deg'
                                }} src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA5ElEQVR4nO3UPUpDQRTF8V8sHikCNoL2WYBVSq3cgqVttuAW3EPK9IJFymgTIRZZg42NgqUIIhoeTCHDy3ujmRTC/OE0wz3nMl+XQqFQyMQtVhjmCgxZK8zbir6DXnGWoekpXn7kdjau9YnLLZqO8RFlbmQZFdaaoJJOFTxxzrLNNMB1g+keRwlND3DX4J9hv8vcC0f8FZmfMGrxHeMx8tQZV9jzC87xFgW942LL2iS6dvHX00niEIuGe7sJitcXwZOFasNLjTVF3w4YN/zNHH8+iRM872DKJc/fh6Ccc71QKPwj1j8gazJLnl+5AAAAAElFTkSuQmCC"></img>
                            </div>
                            {expandedLines.map(elem => (
                                <p style={{paddingLeft: '30px'}}>
                                    {elem} - <a href={'/orare/' + elem}>orar</a> / <a href={`sms:7479&body=${elem}`}>bilet prin SMS</a>
                                </p>
                            ))}
                            <Nav.Link style={{padding: '5px'}} href="https://busify.ro/contact"> Contact </Nav.Link>
                        </Offcanvas.Body>
                    </Offcanvas>
                </Nav>
            </Container>
        </Navbar>
    );
}

export default MapNavbar;