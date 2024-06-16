import MapNavbar from '../MapNavbar'
import './Orare.css'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState, useRef, useEffect } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'

function Orare() {
    const searchValueRef = useRef();
    const [lines, setLines] = useState([]);
    const linesRef = useRef();

    const search = (e) => {
        e.preventDefault();
    }

    const fetchData = async () => {
        try {
            const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
            const buses_basic = await resp.json();
            const sol = []
            const joinArray = (arr) => {
                arr.forEach(elem => {
                    sol.push(elem)
                })
            }
            joinArray(buses_basic.urbane)
            joinArray(buses_basic.metropolitane)
            joinArray(buses_basic.market)
            setLines(sol)
            linesRef.current = sol
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])
    return (
        <div style={{ backgroundColor: 'lightgray' }}>
            <MapNavbar />
            <div className='orare-body-container'>
                <br />
                <div className='orare-content-container'>
                    <h4>Orarele liniilor CTP Cluj</h4>
                    <br />
                    <Form onSubmit={(e) => search(e)}>
                        <InputGroup className="mb-3">
                            <Form.Control
                                placeholder="Cauta o linie"
                                aria-label="Cauta o linie"
                                aria-describedby="basic-addon2"
                                ref={searchValueRef}
                            />
                            <Button type='submit' className='orare-search-button' id="button-addon2"> Cautare </Button>
                        </InputGroup>
                    </Form>
                    <ListGroup>
                        {lines.map((line) => (
                            <ListGroup.Item className='orare-cell' onClick={() => { window.location.href += '/' + line.name }}>
                                <p> <b>Linia {line.name}</b> </p>
                                <p>{line.route}</p>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </div>
    )
}

export default Orare