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
                        src="holder.js/20x20?text=%20"
                        className="rounded me-2"
                        alt=""
                    />
                    <strong className="me-auto">Unde mi busu'?</strong>
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