import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';

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
                    Indicatii pas cu pas pentru a ajunge rapid unde ai nevoie!
                </p>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    props.onHide();
                }}>
                    <Form.Label htmlFor="inputPassword5">Cauta o adresa</Form.Label>
                    <Form.Control
                        ref={props.origin}
                        placeholder='Locatia ta'
                    />
                    <br />
                    <Form.Control
                        ref={props.destination}
                        placeholder='Destinatia'
                    />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Cauta</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default Destinatii