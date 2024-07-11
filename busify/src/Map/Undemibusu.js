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
                    Unde mi-i busu?
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    O inițiativă <b>Busify.ro</b> pentru a-ți găsi cu ușurință autobusul pe care-l aștepți!
                </p>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    props.onHide();
                }}>
                    <Form.Label htmlFor="inputPassword5">Caută o linie</Form.Label>
                    <Form.Control
                        placeholder="Exemplu: 25"
                        ref={props.undemibususearchref}
                    />
                    <Form.Text>
                        Introdu linia pe care o cauți, sau apasă pe închide pentru a le vizualiza pe toate. De asemenea, poți merge în setări apăsând pe butonul din dreapta pentru a mai afișa sau ascunde alte linii.
                    </Form.Text>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button style={{background:'purple'}} onClick={props.onHide}>Închide</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default Undemibusu