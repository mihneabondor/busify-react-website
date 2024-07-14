import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import React, { useRef, useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Accordion from 'react-bootstrap/Accordion';
import InputGroup from 'react-bootstrap/InputGroup'


function Settings(props) {
    let searchValueRef = useRef()
    let vehicles = useRef([])
    let copie = useRef([])
    let [vehiclesState, setVehiclesState] = useState([])

    const change = (e) => {
        if (searchValueRef.current) {
            copie.current = vehicles.current
            if (searchValueRef.current.value !== '')
                copie.current = copie.current.filter(elem => elem[0].includes(searchValueRef.current.value.toUpperCase()))
            setVehiclesState(copie.current)
        }
    }

    useEffect(() => {
        if (vehicles.current.length === 0) {
            console.log('asdasd')
            vehicles.current = props.vehicles
            setVehiclesState(vehicles.current)
        }
        change()
    }, [props.show])

    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Setări
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Alege linii</Accordion.Header>
                        <Accordion.Body>
                            <Form>
                                <div className="mb-3">
                                    <Form.Check
                                        inline
                                        label='Selectează tot'
                                        type='checkbox'
                                        checked={props.selectAllCheck}
                                        onChange={(e) => {
                                            props.setChecked(prev => {
                                                setVehiclesState(vehicles.current.map(elem => [elem[0], !prev]))
                                                props.setVehicles(props.vehicles.map(elem => [elem[0], !prev]))
                                                return !prev
                                            })
                                        }}
                                    />
                                </div>
                                <Container>
                                    <Row>
                                        {vehiclesState.map((vehicle) => (
                                            <Col xs={3}>
                                                <div className="mb-3">
                                                    <Form.Check
                                                        inline
                                                        label={vehicle}
                                                        type='checkbox'
                                                        name={vehicle}
                                                        checked={vehicle[1]}
                                                        onChange={(e) => {
                                                            let sol = [], allChecked = true
                                                            for (let i = 0; i < props.vehicles.length; i++) {
                                                                if (vehicle[0] === props.vehicles[i][0]) {
                                                                    sol.push([props.vehicles[i][0], !Boolean(props.vehicles[i][1])])
                                                                }
                                                                else sol.push(props.vehicles[i])

                                                                if (sol[i][1] === false)
                                                                    allChecked = false;
                                                            }
                                                            props.setVehicles(sol)
                                                            props.setChecked(allChecked)

                                                            setVehiclesState(sol)
                                                            vehicles.current = sol
                                                            change()

                                                            localStorage.setItem('linii_selectate', props.vehicles);
                                                        }}
                                                        id={vehicle}
                                                    />
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Container>
                            </Form>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide} style={{background: 'purple'}} >Închide</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Settings;