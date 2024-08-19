import MapNavbar from '../MapNavbar'
import './Orare.css'
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState, useRef, useEffect } from 'react'
import ListGroup from 'react-bootstrap/ListGroup'
import { useNavigate } from "react-router-dom";
import Badge from 'react-bootstrap/Badge';
import Stiri from './Stiri';
import Anunt from './Anunt';

function Orare() {
    const searchValueRef = useRef();
    const [lines, setLines] = useState([]);
    const linesRef = useRef();
    const copie = useRef();
    const nav = useNavigate();

    const search = (e) => {
        e.preventDefault();
        if (linesRef.current.find(elem => elem.name === searchValueRef.current.value.toUpperCase())) {
            let url = '/orare/' + searchValueRef.current.value.toUpperCase();
            console.log(url)
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
        linesRef.current = copie.current
        setLines(linesRef.current)
        if (searchValueRef.current.value !== '') {
            linesRef.current = linesRef.current.filter(elem => elem.name.includes(searchValueRef.current.value.toUpperCase()))
            setLines(linesRef.current)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])
    return (
        <div style={{ height: '100vh' }}>
            <MapNavbar />
            <div className='orare-body-container'>
                <div className='orare-content-container'>
                    <h4>Ultimele știri</h4>
                    <Stiri />
                    <br/>
                    <Anunt/>
                    <br />
                    <h4>Orarele liniilor CTP Cluj</h4>
                    <Form onChange={(e) => change(e)} onSubmit={search}>
                        <InputGroup className="mb-3">
                            <Form.Control
                                placeholder="Caută o linie"
                                aria-describedby="basic-addon2"
                                ref={searchValueRef}
                            />
                            <Button type='submit' className='orare-search-button' id="button-addon2"> Căutare </Button>
                        </InputGroup>
                    </Form>
                    <ListGroup style={{ overflow: 'auto', height: '65vh' }}>
                        {lines.map((line) => (
                            <ListGroup.Item
                                className="d-flex justify-content-between align-items-start orare-cell"
                                onClick={() => {
                                    let url = '/orare/' + line.name
                                    nav(url)
                                }}
                            >
                                <div className="ms-2 me-auto">
                                    <div className="fw-bold">Linia {line.name}</div>
                                    {line.route}
                                </div>
                                <Badge bg='gray'>
                                    {line.type === 'troleibuze' ?
                                        <img width='20px' height='20px' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB7ElEQVR4nO2aXUoDMRSFv4fiDqz9WYqCuAKruJD6g+2rVHQfiq5CEATfRF2DOn2uUqh9sJFAHsqQGZLJZJLqHLgvZc6599ybSTqdghsegHug4aAhuY/AHQHxDAig76DRVxpPBMQWsAC+gE4B/gYwUUZ2CIxbVchVAe614t4QAVqqq3Iy2xa8zaVpdqkATWAEvABT1cEqYqruQZl73dXEgeqYCByfwL6LiUUEJoSKnyJmmpFMQqRiYrvMRhEULTLizMbIq0Zgpg4vuUv5Rhs4VDnTdcgNwBi6ZeVyehfFkaYOWZsxdCOtYhK6k19XizGcyCVD1EZY8YnsAeOiZI8QGbXIWns6wnjpolUwIoAkj5BHjs2IyCPkkUNA1EaoJ+IF4t8urWQFjXzoCL2lfXkVjCTAblHyn/jS2KJ6dHwYkQ85VePEh5GZMiMfQ32jDRwD3z6MxBTGCF2oqI2kELrjop5ICrqOzIFTtbfLGKjPyuqyjb4xdGQpnMagRCM2+k5GdOdHq0QjNvpORnTvCLslGrHRdzKiG/3Q89Ia+jAyV8l83uyDKm72mMIYf8bIewTFiox4szFyHkHBIiPka0GrP7qISKOBJUpfr6HyJQai2p9jCsJbvksD4YsSjXjLt6bEdZ2SnZGi8pqy4JTvF+RlRZVR5d+zAAAAAElFTkSuQmCC" />
                                        : line.type === 'autobuze' ? <img width='20px' height='20px' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABzklEQVR4nO2ZvU7DMBRGDwws0IGIkQeAFQEDPzuwUPVZeAAkJCqExMA7MDF0aNjZ4BnKltIBBiZAFQiMjBIJVbFrl7h22nzSla3q6n732ImS1KDWMnAEtIAH4AX4BMSY4xXoANdAHZjBULPAMfDhoWlhEDFQMwE5D6BZMSSuhkGsAF8BNCoMYk0HcmFRaAs32jb0P9MVubcAcSlhELe6As8lAunoCvQtQHYcQewa+j/piogSRX9SQMTUgvSABhAxfkWpd88E5ADopvO8ZFnItxoaENn7fjbJfsxL9rETg4o0IHJMsokOJBQJDcjvvAIZs0S1I1T3iBOJ6tKiZJdWdwKeIwnp4z0pMUgC7JkmhyDx37ffiQGJ8K+lIkBCeI0/CeXDSv5fuzhCrAKXwHcRICGHUr4bExXIgHyvsKh2ZECqFWkDG8B8OsYOV7lt4aWUqnCeWo4gbLyUykteV+RuOgBZt/SyAlGd19UcgNQsvaZzR2JF7o0DkNjSywokM5CrspCOLiBG8VLq3WGDRcdbUYehvuNOB1IPoEFhGIc6EN19EloM1dSBuJIoyl91Xvc3Hp1hUJx/06DQqUOQZlH+c2mxvJWRKyGLyBxXGsn/B6l4OuxEhf6WAAAAAElFTkSuQmCC" />
                                            : <img width='20px' height='20px' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAChUlEQVR4nO2aPWsVQRSGH7ULCAaM6A0IimgXrURzFRX0J1hpQPEj4g/wRm2sQizSSaxV0MYPUBuxU7ARRYKNSCKmkKiYC0Iwt4grB05kWOYm+3FmJ4F9YJqZ2ffMuzOzX2ehPBuAQ8B14AHwBpgEpoA5oKNlTusmtc994BrQVI2oXABmgKRkEY1zsUxcdQbyFZhIGTsK9Dr9e7VuaeDS93bqRLRiGPmuwYeB9U79U60f8hwzpG3SZwk59pLWzxKB18ArT/2oDmrM0zambaM59KJxWgf7zNP2XNtOsQbYp4Od9rR90ba9rELWAQPARWAceKmD/Qu0nY3c1rpE+4zrhh9QjSjIBj0B3HU2fZkyq1rHUxeOYMiN66yzREKUaeBMSEN7gPcBDaTLO2C3tYkjwO8KTSRaJOZhKxM7U5u26tIGdlgYuZcx4GAB7WZG7TsWRrJelYqSRfuHhZGsS2C16v8n1t5IaiNd8J2dh8A27GkAj6uckc2Eo69KI6FJaiPLUM9ICZJ6aS1DvbTWwtLqIxxbqjTyCOjHnn7gSf2stQKxn3qT+jE+ReyZSOoZSeE7O5KBuqLvDw3Na3QKnOU8OqXxifoSMq0CRvLolMYn6ns73FrASB6d0vhEZRn4bmZ5jeTRKU0n45IYMVpaI132Ummmugi3jDZ7Fp3PFkYmCgzQutyyMCKf9hcimvgD7MKIyxGNDGPMeWC+QgPzmh0LglwabwKLAQ0sagzfpdmMjc6fDQuaU7fipDPjL4BNBEIyVx810Ddgf6Ac/YzG+KR5S1OaTsLnA7CdcDSAtxrrF3DMSnjQuUnJV/gewtOjsSSmxD5oISoiP4EbFf+hILEkpsQ+sFLvf6fcs2hxhnn4AAAAAElFTkSuQmCC" />}
                                </Badge>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </div>
            </div>
        </div>
    )
}

export default Orare