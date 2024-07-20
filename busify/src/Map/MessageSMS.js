import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/esm/Button';
import { useEffect, useRef } from 'react';

function MessageSMS(props) {
    const phoneNumberRef = useRef()

    useEffect(() => {
      if(localStorage.getItem('numar_telefon') && props.show)
          phoneNumberRef.current.value = localStorage.getItem('numar_telefon').slice(3)
    }, [props.show])

    return(
        <Modal centered show={props.show} onHide={() => {props.setshow()}}>
        <Modal.Header closeButton>
            <Modal.Title>Anunț prin SMS</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Vei primi un mesaj SMS când un vehicul din linia aleasă ajunge în stația selectată!</p>
        <InputGroup className="mb-3">
        <InputGroup.Text id="basic-addon1">+40</InputGroup.Text>
        <Form.Control
          type='tel'
          ref={phoneNumberRef}
          placeholder="Număr de telefon"
          aria-label="Username"
          aria-describedby="basic-addon1"
        />
      </InputGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button style={{background: 'purple'}} onClick={() => {
            const phoneNumber =`+40${phoneNumberRef.current.value}`
            localStorage.setItem('numar_telefon', phoneNumber)
            props.socket.current.emit('notifications', props.smsData.vehicle, props.smsData.stop, phoneNumber);
            props.setshow()
          }}>Confirmă</Button>
        </Modal.Footer>
        </Modal>
    )
}

export default MessageSMS;