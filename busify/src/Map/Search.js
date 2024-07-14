import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useRef, useState } from 'react';
import Badge from 'react-bootstrap/esm/Badge';
import '../Orare/Orar.css'

function Search(props) {
    const searchRef = useRef()
    const [liniiGasite, setLiniiGasite] = useState([])
    const [liniiAdiacente, setLiniiiAdiacente] = useState(true)

    const change = (e) => {
        e.preventDefault()
        const split = searchRef.current.value.split(' ')

        if(split.length === 2){
            const newLiniiGasite = [...liniiGasite, split[0].toUpperCase()]
            setLiniiGasite(newLiniiGasite)
            searchRef.current.value = split[1]
        }
    }

    const removeLine = (ind) => {
        const newLiniiGasite = liniiGasite.filter((_, index) => index !== ind)
        setLiniiGasite(newLiniiGasite)
    }

    return (
        <Modal show={props.show} onHide={() => {
            props.onHide()
            setLiniiGasite([])
        }}>
            <Modal.Header closeButton>
                <Modal.Title>Căutare</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control placeholder="Ex: 25 43" aria-describedby="desc" onChange={change} ref={searchRef} />
                <Form.Text id="desc" muted>
                    Întrodu liniile căutate, separate prin câte un spațiu
                </Form.Text>
                {liniiGasite.map((elem, ind) => (
                    <Badge pill bg="secondary" key={ind} style={{marginRight: '10px', cursor: 'pointer'}} onClick={() => removeLine(ind)}>
                        {elem} <small> <b>X</b></small>
                    </Badge>
                ))}
                <br/>
                <Form.Check
                    type="switch"
                    label="Arată liniile adiacente (ex. 43 43P 43B)"
                    id='custom-switch'
                    checked={liniiAdiacente}
                    onChange={() => setLiniiiAdiacente(!liniiAdiacente)}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => {
                    props.onHide()
                    setLiniiGasite([])
                }}>
                    Închide
                </Button>
                <Button style={{background: 'purple'}} variant="primary" onClick={() => {
                    const newLiniiGasite = [...liniiGasite, searchRef.current.value.toUpperCase()]
                    setLiniiGasite(newLiniiGasite)

                    let exista = false
                    if(newLiniiGasite.length) {
                        props.unique.current.forEach(elem => {
                            if(liniiAdiacente) {
                                newLiniiGasite.forEach(el => {
                                    if (elem[0].startsWith(el) && !exista)
                                        exista = el !== ''
                                })
                            } else {
                                if (newLiniiGasite.includes(elem[0]))
                                    exista = true
                            }
                        })
        
                        if (exista) {
                            let oneMatch = false;
                            props.unique.current = props.unique.current.map((elem) => [elem[0], newLiniiGasite.includes(elem[0])])

                            if(liniiAdiacente) {
                                const check = (elem) => {
                                    let exista = false
                                    newLiniiGasite.forEach(el => {
                                        if (elem.startsWith(el) && !exista)
                                            exista = el !== ''
                                    })
                                    return exista
                                }
                                props.unique.current = props.unique.current.map(elem => [elem[0], check(elem[0])])
                            }
                            props.unique.current.forEach(elem => {
                                if (elem[1]) oneMatch = true
                            });
                            console.log(oneMatch)
                            if (!oneMatch)
                                props.setShownVehicles();
                            else props.setShowUndemibusuToast()
        
                            props.setUniqueLines(props.unique.current)
                            props.setCheckAllChecked(!oneMatch)
                            props.resetMarkers();
                        }
                    }
                    props.onHide()
                    setLiniiGasite([])

                }}>
                    Caută
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Search;
