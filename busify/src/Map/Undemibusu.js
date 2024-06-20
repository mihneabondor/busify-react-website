import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

function Undemibusu(props) {
    return (
        <Modal
            {...props}
            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Unde mi busu?
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    O initiativa <b>Busify.ro</b> pentru a-ti gasi cu usurinta autobusul pe care il astepti!
                </p>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    props.onHide();
                }}>
                    <Form.Label htmlFor="inputPassword5">Cauta o linie</Form.Label>
                    <Form.Control
                        placeholder="Exemplu: 25"
                        ref={props.undemibususearchref}
                    />
                    <Form.Text>
                        Introdu linia pe care o cauti, sau apasa pe inchide pentru a le vizualiza pe toate. De asemenea, poti merge in setari apasand pe butonul din dreapta pentru a mai afisa sau ascunde alte linii.
                    </Form.Text>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Inchide</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default Undemibusu