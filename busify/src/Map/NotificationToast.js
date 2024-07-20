import React, { useState } from 'react';
import ToastContainer from 'react-bootstrap/esm/ToastContainer';
import Toast from 'react-bootstrap/Toast';

function NotificationToast(props) {

  return (
    <ToastContainer
        className="p-3"
        position={'top-end'}
        style={{ zIndex: 10 }}
    >
    <Toast onClose={props.onHide} show={props.show} delay={7000} autohide>
        <Toast.Header>
        <img
            src="../logo192.png"
            width='25px'
            height='25px'

            className="rounded me-2"
        />
        <strong className="me-auto">Busify</strong>
        </Toast.Header>
        <Toast.Body>{props.title}</Toast.Body>
    </Toast>
    </ToastContainer>
  );
}

export default NotificationToast;