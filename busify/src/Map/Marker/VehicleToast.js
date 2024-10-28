import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Button from 'react-bootstrap/esm/Button';
import { useEffect, useState } from 'react';
import CloseButton from 'react-bootstrap/esm/CloseButton';
import Form from 'react-bootstrap/Form'

function VehicleToast(props) {
    const [expanded, setExpanded] = useState(true)
    const [linieFav, setLinieFav] = useState(false)

    useEffect(() => {
        if(props.vehicle) {
            const lines = localStorage.getItem('linii_favorite')
            if(lines){
                setLinieFav(lines.includes(props.vehicle.line +' '))
            }
        }
    }, [props.vehicle])

    return (
        <ToastContainer
            className="p-3"
            position={'bottom-center'}
            style={{ zIndex: 10 }}
        >
            <Toast show={props.show}>
                <Toast.Header closeButton={false}>
                    <img
                        src="../logo192.png"
                        width='25px'
                        height='25px'
                        className="rounded me-2"
                    />
                    <strong className="me-auto">Linia {props.header}</strong>
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
                    <p><b>Spre:</b> {props.vehicle.headsign}</p>
                    <Form.Switch
                        style={{marginTop: '-10px'}}
                        checked={linieFav}
                        id="custom-switch"
                        label= 'Linie favorită'
                        onChange={() => {
                            setLinieFav(!linieFav)
                            const linie = props.vehicle.line
                            var linii = localStorage.getItem('linii_favorite');
                            if (!linii)
                                linii = '';
                
                            if (linii.search(linie) != -1) {
                                linii = linii.replace(linie + ' ', '')
                            } else {
                                linii += linie + ' ';
                            }
                
                            localStorage.setItem('linii_favorite', linii)
                        }}
                    />
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: "space-around", marginTop: '10px', marginBottom: '10px'}}>
                        <a href={'/orare/' + props.vehicle.line}><svg xmlns="http://www.w3.org/2000/svg" style={{height: '25', width: '25'}} viewBox="0 0 448 512"><path d="M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z"/></svg></a>
                        <a href='#' onClick={() => {
                            props.map.current.flyTo({
                                center: props.vehicle.lngLat,
                                duration: 1000,
                                zoom: 15,
                                essential: true
                            })
                        }}><svg xmlns="http://www.w3.org/2000/svg" style={{height: '25', width: '25'}} viewBox="0 0 512 512"><path d="M256 0c17.7 0 32 14.3 32 32l0 34.7C368.4 80.1 431.9 143.6 445.3 224l34.7 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-34.7 0C431.9 368.4 368.4 431.9 288 445.3l0 34.7c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-34.7C143.6 431.9 80.1 368.4 66.7 288L32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l34.7 0C80.1 143.6 143.6 80.1 224 66.7L224 32c0-17.7 14.3-32 32-32zM128 256a128 128 0 1 0 256 0 128 128 0 1 0 -256 0zm128-80a80 80 0 1 1 0 160 80 80 0 1 1 0-160z"/></svg></a>
                        <a href='#' onClick={() => {
                            navigator.clipboard.writeText(`https://app.busify.ro/map?id=${props.vehicle.label}`)
                            props.setShowNotification()
                        }}><svg xmlns="http://www.w3.org/2000/svg" style={{height: '25', width: '25'}} viewBox="0 0 512 512"><path d="M307 34.8c-11.5 5.1-19 16.6-19 29.2l0 64-112 0C78.8 128 0 206.8 0 304C0 417.3 81.5 467.9 100.2 478.1c2.5 1.4 5.3 1.9 8.1 1.9c10.9 0 19.7-8.9 19.7-19.7c0-7.5-4.3-14.4-9.8-19.5C108.8 431.9 96 414.4 96 384c0-53 43-96 96-96l96 0 0 64c0 12.6 7.4 24.1 19 29.2s25 3 34.4-5.4l160-144c6.7-6.1 10.6-14.7 10.6-23.8s-3.8-17.7-10.6-23.8l-160-144c-9.4-8.5-22.9-10.6-34.4-5.4z"/></svg></a>
                    </div>

                    <small style={{color: 'gray'}}>Tip: selectează o stație pentru a primi SMS când vehiculul se apropie!</small>
                </Toast.Body>
            </Toast>
        </ToastContainer>
    )
}

export default VehicleToast