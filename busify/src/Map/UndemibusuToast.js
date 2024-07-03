import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Button from 'react-bootstrap/esm/Button';

function UndemibusuToast(props) {
    return (
        <ToastContainer
            className="p-3"
            position={'bottom-center'}
            style={{ zIndex: 1 }}
        >
            <Toast show={props.show}>
                <Toast.Header closeButton={false}>
                    <img
                        src="../logo192.png"
                        width='25px'
                        height='25px'

                        className="rounded me-2"
                    />
                    <strong className="me-auto">Unde mi-i busu'?</strong>
                </Toast.Header>
                <Toast.Body>
                    <p>Apasa aici pentru a afisa toate autobusele</p>
                    <Button onClick={props.onHide}>Revino</Button>
                </Toast.Body>
            </Toast>
        </ToastContainer>
    )
}

export default UndemibusuToast