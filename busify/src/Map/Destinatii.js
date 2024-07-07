import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';
import InputGroup from 'react-bootstrap/InputGroup';
import locationicon from './location_icon.png';

function Destinatii(props) {
    const nav = useNavigate();
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Destinatii
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    Indicații pas cu pas pentru a ajunge rapid unde ai nevoie!
                </p>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    props.onHide();
                }}>
                    <Form.Label htmlFor="inputPassword5">Caută o adresă</Form.Label>
                    <InputGroup className="mb-3">
                        <Form.Control
                            ref={props.origin}
                            placeholder='Locația ta'
                        />
                        <Button style={{ background: 'purple' }} onClick={() => {
                            props.getuseraddress()
                        }}>
                            <img width='20px' height='20px' src={locationicon}></img>
                        </Button>
                    </InputGroup>
                    <Form.Control
                        ref={props.destination}
                        placeholder='Destinație'
                    />
                    <br />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='secondary' onClick={() => {
                    window.location.href = '/map'
                }}>Mergi la hartă</Button>
                <Button onClick={props.onHide} style={{ background: "purple" }} >Caută</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default Destinatii