import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Button from 'react-bootstrap/esm/Button';
import { useState } from 'react';

function UndemibusuToast(props) {
    const [expanded, setExpanded] = useState(true)
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
                    <strong className="me-auto">{props.header}</strong>
                    <img
                            style={{
                                marginLeft: '20px', 
                                cursor: 'pointer',
                                rotate: expanded ? '90deg' : '0deg'
                            }}
                            width='20px'
                            height='20px'
                            src= { expanded ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWElEQVR4nO3bwW7CMBAE0Em/soUPKuXMoYf+ZXuBy1SOjGRFIXFMJOSdGWkFlyD8cNDaGAAYABwBfOTncjkAYK5vRYRjASCJMORByyNcJgg/AN4gNhMuRoARBiPACCmeCTDCrn3CGcAfgC+IIlzzdelR8juBRUERgREAnkEIA9CKEAqgBSEcwFaEkABbEMIC1CKEBqhBCA+whiABsNQ2ywA8mglSAGsI3eYM4LbwydZWt/ndYfDdLodTTsW6vnXwn+MrOY7jOI6zc6N16/V3h3ue6THulZq1bsMdusyuGy3OlNRJFaojcGETReL0GouSPJ/AyZ6BHAJnNk2kEPhg10gGgQvbZhIIXNk3DI/AFYDwCKwACI3ASoCwCNwAEBLhWqzqJP/vcMqHKbcuaUMhtCbc7dASI8AIYzwTYIQxngkwwhj3CZhHOEAsU4T3V7+hVyQhpIGnGv4BDUeLkcktg7YAAAAASUVORK5CYII=" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAzUlEQVR4nO3ZQQqDMBSE4bnEk16xPW5d9DgpKaU8iproauYxP2TvR4gmBnDOKdQuDMrKQEYFgKc6ZAGwfh9+VYVEmokXgJsiJDYQUIPEDkIKEgcIGUgMEBKQGQQ9ZBZBDTmDoIWcRVBCriDoMoKlEjPRe6RdbN/VSnevgHDO4bOQ+4KWbkk/CPqrVrKo8LELI0gK5plokwcXasQshB4xA5FAjCAyiCOIFGIPIofYgkgi/iGyiAyRRmRIvu6SPGO3NCRnotxVcasCcc7h1xuvJbgvN2HU5wAAAABJRU5ErkJggg=="} 
                            onClick={() => {
                                if(expanded)
                                    setExpanded(false)
                                else setExpanded(true)
                            }}></img>
                </Toast.Header>
                <Toast.Body style={{display: expanded ? 'grid' : 'none'}}>
                    <p>Apasă aici pentru a vizualiza toate liniile</p>
                    <Button style={{background: 'purple'}} onClick={props.onHide}>Revino</Button>
                </Toast.Body>
            </Toast>
        </ToastContainer>
    )
}

export default UndemibusuToast