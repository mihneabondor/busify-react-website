import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Accordion from 'react-bootstrap/Accordion';


function Settings(props) {
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Setari
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Filtreaza linii</Accordion.Header>
                        <Accordion.Body>
                            <Form>
                                <div className="mb-3">
                                    <Form.Check
                                        inline
                                        label='Selecteaza tot'
                                        type='checkbox'
                                        checked={props.selectAllCheck}
                                        onChange={(e) => {
                                            props.setChecked(prev => {
                                                props.setVehicles(props.vehicles.map(elem => [elem[0], !prev]))
                                                return !prev
                                            })
                                        }}
                                    />
                                </div>
                                <Container>
                                    <Row>
                                        {props.vehicles.map((vehicle) => (
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
                <Button onClick={props.onHide}>Inchide</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default Settings;