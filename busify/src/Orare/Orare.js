import MapNavbar from '../MapNavbar'
import './Orare.css'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState, useRef, useEffect } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useNavigate } from "react-router-dom";

function Orare() {
    const searchValueRef = useRef();
    const [lines, setLines] = useState([]);
    const linesRef = useRef();
    const copie = useRef();
    const nav = useNavigate();

    const search = (e) => {
        e.preventDefault();
        if (linesRef.current.find(elem => elem.name === searchValueRef.current.value)) {
            let url = '/orar/' + searchValueRef.current.value;
            nav(url);
        } else alert('Linia pe care ai introdus-o nu exista!')
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
            copie.current = sol
        } catch (err) {
            console.log(err)
        }
    }

    const change = (e) => {
        if (searchValueRef.current.value === '') {
            linesRef.current = copie.current
            setLines(linesRef.current)
        } else {
            linesRef.current = linesRef.current.filter(elem => elem.name.includes(searchValueRef.current.value))
            setLines(linesRef.current)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])
    return (
        <div style={{ backgroundColor: 'lightgray', height: '100vh' }}>
            <MapNavbar />
            <div className='orare-body-container'>
                <br />
                <div className='orare-content-container'>
                    <h4>Orarele liniilor CTP Cluj</h4>
                    <br />
                    <Form onSubmit={(e) => search(e)} onChange={(e) => change(e)}>
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
                    <ListGroup style={{ overflow: 'auto', height: '65vh' }}>
                        {lines.map((line) => (
                            <ListGroup.Item
                                className="d-flex justify-content-between align-items-start orare-cell"
                                onClick={() => {
                                    let url = '/orar/' + line.name
                                    nav(url)
                                }}
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">Linia {line.name}</div>
                                    {line.route}
                                </div>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </div>
    )
}

export default Orare