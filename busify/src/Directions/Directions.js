import '../Orare/Orare.css'
import Form from 'react-bootstrap/Form';
import {useEffect, useRef, useState} from 'react'
import {useNavigate} from "react-router-dom";
import {ReactComponent as BackButton} from "../Images/backButton.svg";
import {useSheet} from "../Contexts/SheetContext";
import {ReactComponent as Decoration} from "../Images/DirectionsDecoration.svg";
import {ReactComponent as SwitchIcon} from '../Images/SwitchIcon.svg'
import Button from "react-bootstrap/Button";

function Directions() {
    const searchValueRef = useRef();
    const [lines, setLines] = useState([]);
    const linesRef = useRef();
    const copie = useRef();
    const nav = useNavigate();
    const [searchValue, setSearchValue] = useState('');

    const {sheetOpen, setSheetOpen} = useSheet();

    return (
        <div className="orare">
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                zIndex: 10,
                width: "90%",
            }}>
                <div><b> Lucrăm cu spor la propriul sistem de direcții pas cu pas! </b></div>
                <div> Acesta va fi disponibil exclusiv abonaților.</div>
                <Button style={{margin: '15px', visibility: !localStorage.hasOwnProperty("active_subscription") ? "visible" : "hidden"}} onClick={() => {nav('/setari?abonare=true')}}><b>Devino abonat!</b></Button>
                <Button variant={'undefined'} style={{outline: 'solid 1px'}} onClick={() => {nav(-1)}} > Înapoi </Button>
            </div>
            <div style={{filter: "blur(4px)", pointerEvents: "none", userSelect: "none"}}>
                <div className="orare-content-header" style={{padding: "20px"}}>
                    <BackButton style={{marginRight: "auto"}} onClick={() => {nav(-1)}}/>
                    <h2><b>Direcții pas cu pas</b></h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                        <Decoration style={{ flexShrink: 0 }} />
                        <Form style={{ flex: 1 }} onSubmit={(e) => {
                            e.preventDefault();
                            if (lines.filter(elem => elem.name === searchValue).length > 0 && localStorage.getItem('linii_favorite').split(" ").includes(`${searchValue}`)) {
                                setSheetOpen(false);
                                nav(`/favorite/${searchValue}`)
                            } else {
                                alert("Linie invalida")
                            }
                        }}>
                            <Form.Group style={{ display: "flex", flexDirection: "column", gap: "20px", margin: 0 }}>
                                <Form.Control type="text" placeholder="Locația de început" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                                <Form.Control type="text" placeholder="Destinație" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
                            </Form.Group>
                        </Form>
                        <SwitchIcon style={{scale: "1.2", margin: "3px"}}/>
                    </div>
                </div>

                <div className='orare-body-container'>

                </div>
                <br/> <br/> <br/>
            </div>
        </div>
    )
}

export default Directions