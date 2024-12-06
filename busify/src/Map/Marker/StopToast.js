import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import { useEffect, useState } from 'react';
import CloseButton from 'react-bootstrap/esm/CloseButton';
import Form from 'react-bootstrap/Form'

function StopToast(props) {
    const [expanded, setExpanded] = useState(true)
    const [notificationsScheduled, setNoficationsScheduled] = useState(false);

    useEffect(() => {
        if(!props.show)
            return;
        let scheduledNotifications = localStorage.getItem('scheduledNotifications') || '[]'
        scheduledNotifications = JSON.parse(scheduledNotifications);
        console.log(scheduledNotifications);
        scheduledNotifications = scheduledNotifications.filter(x => props.selectedVehicle.vehicle && x[0] && x[0].vehicle && props.selectedVehicle.vehicle.line === x[0].vehicle.line && x[1].stop_name === props.header)
        setNoficationsScheduled(scheduledNotifications.length > 0);
    }, [props.show])

    return (
        <ToastContainer
            className="p-3"
            position={'bottom-center'}
            style={{ zIndex: 11 }}
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
                    <CloseButton onClick={props.onHide}/>
                </Toast.Header>
                <Toast.Body style={{display: expanded ? 'grid' : 'none'}}>
                    <Form.Switch
                        checked={notificationsScheduled}
                        disabled={!localStorage.getItem('notificationUserId')}
                        id="custom-switch"
                        label= "Notifică când se aproapie"
                        onChange={() => {
                            setNoficationsScheduled(!notificationsScheduled);

                            let notificationData = [props.selectedVehicle, props.stop]

                            let scheduledNotifications = localStorage.getItem('scheduledNotifications') || '[]'
                            scheduledNotifications = JSON.parse(scheduledNotifications)

                            if(scheduledNotifications.some(elem => elem[0].vehicle.line === notificationData[0].vehicle.line && elem[1].stop_name === notificationData[1].stop_name)) {
                                console.log("intra")
                                scheduledNotifications = scheduledNotifications.filter(elem => elem[0] !== notificationData[0] && elem[1].stop_name !== notificationData[1].stop_name)
                            } else {
                                scheduledNotifications.push(notificationData)
                            }

                            console.log(notificationData)
                            console.log(scheduledNotifications)

                            localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications))

                            props.socket.current.emit('notifications', localStorage.getItem('notificationUserId'), notificationData[0], notificationData[1]);
                        }}
                    />
                    <small style={{display: !localStorage.getItem('notificationUserId') ? "initial" : "none", color: 'gray'}}>
                        * Notificările aplicației trebuie să fie pornite!
                    </small>
                </Toast.Body>
            </Toast>
        </ToastContainer>
    )
}

export default StopToast