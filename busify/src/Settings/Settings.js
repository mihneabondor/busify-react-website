import BottomBar from "../OtherComponents/BottomBar";
import {ButtonGroup} from "react-bootstrap";
import Button from "react-bootstrap/esm/Button";

import {ReactComponent as PCIcon} from "../Images/PCIcon.svg";
import {ReactComponent as FavoriteIcon} from "../Images/favoriteIcon.svg";
import {ReactComponent as TroleibusIcon} from "../Images/troleibusIcon.svg";
import {ReactComponent as BusIcon} from "../Images/busIcon.svg";
import {ReactComponent as TramIcon} from "../Images/tramvaiIcon.svg";
import {ReactComponent as HeartIconFill} from "../Images/heartIconFill.svg";

import {ReactComponent as TOSIcon} from "../Images/TOSIcon.svg";
import {ReactComponent as ArrowRight} from "../Images/arrow-up-right.svg";
import {useState} from "react";
import CustomSwitch from "../OtherComponents/CustomSwitch";
import {ReactComponent as ChevronRightIcon} from "../Images/ChevronRightIcon.svg";
import {useLocation, useNavigate} from "react-router-dom";
import PaywallSheet from "../Paywall/PaywallSheet";

import { TbLocation } from "react-icons/tb";
import { GrConfigure } from "react-icons/gr";
import { LiaPiggyBankSolid } from "react-icons/lia";
import { GoCommentDiscussion } from "react-icons/go";



function Settings() {
    const [iconite, setIconite] = useState(localStorage.getItem("iconite") === "true");
    const [sageti, setSageti] = useState(localStorage.getItem("sageti"));
    const nav = useNavigate();
    const location = useLocation();
    const [showDonationPaywall, setShowDonationPaywall] = useState(false);

    return (
        <div
            style={{
                height: '98vh',
                background: '#F6F8FA',
                padding: '50px 20px 0px 20px',
                display: 'flex',
                flexDirection: 'column',
            }}>
            <h3>
                <b>Setări</b>
            </h3>

            <br/>
            <br/>

            <small>Personalizare</small>
            <ButtonGroup vertical>
                <Button variant="undefined" style={{
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                    background: 'white',
                    width: '90vw',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <BusIcon style={{
                        marginRight: 10,
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)'
                    }}/>
                    <div>Iconițele vehiculelor pe hartă</div>
                    <CustomSwitch
                        checked={iconite}
                        onChange={() => {
                            if (localStorage.getItem("iconite") === "true") {
                                localStorage.setItem("iconite", "false")
                            } else {
                                localStorage.setItem("iconite", "true")
                            }
                            setIconite(!iconite)
                        }}
                    />
                </Button>

                <Button variant="undefined" style={{
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                    background: 'white',
                    width: '90vw',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <TbLocation style={{
                        marginRight: 10,
                        scale: "1.3",
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)'
                    }}/>
                    <div>Săgeți pe hartă</div>
                    <CustomSwitch
                        checked={sageti}
                        onChange={() => {
                            if (localStorage.getItem("sageti") === "true") {
                                localStorage.setItem("sageti", "false")
                            } else {
                                localStorage.setItem("sageti", "true")
                            }
                            setSageti(!sageti)
                        }}
                    />
                </Button>

                <Button variant="undefined" style={{
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                    background: 'white',
                    width: '90vw',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
                        onClick={() => {
                            nav('/setari/panou-linii')
                        }}
                >
                    <GrConfigure style={{
                        marginRight: 10,
                        scale: "1.2",
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)'
                    }}/>
                    <div>Configurează liniile afișate</div>
                    <ChevronRightIcon style={{marginLeft: 'auto'}}/>
                </Button>
            </ButtonGroup>

            <br/>

            <small>Susține dezvoltarea Busify</small>
            <ButtonGroup vertical>
                <Button variant="undefined" style={{
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                    background: 'white',
                    width: '90vw',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }} onClick={() => {
                    setShowDonationPaywall(true)
                }}>
                    <LiaPiggyBankSolid style={{
                        scale: "1.7",
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)',
                        marginRight: 10
                    }}/>
                    <div>Donează (în lucru)</div>
                    <ArrowRight style={{
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)',
                        marginLeft: 'auto'
                    }}/>
                </Button>
                <Button variant="undefined" style={{
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                    background: 'white',
                    width: '90vw',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }} onClick={() => {
                    window.location.href = "https://busify.ro/contact"
                }}>
                    <GoCommentDiscussion style={{
                        marginRight: 10,
                        scale: "1.4",
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)'
                    }}/>
                    <div>Sugestii? Scrie-ne!</div>
                    <ArrowRight style={{
                        filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)',
                        marginLeft: 'auto'
                    }}/>
                </Button>
            </ButtonGroup>

                <br/>

                <small>Legal</small>
                <ButtonGroup vertical>
                    <Button variant="undefined" style={{
                        boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                        background: 'white',
                        width: '90vw',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center'
                    }} onClick={() => {
                        window.location.href = "https://busify.ro/privacypolicy"
                    }}>
                        <PCIcon style={{marginRight: 10, scale: '0.9'}}/>
                        <div>Politică de confidențialitate</div>
                        <ArrowRight style={{
                            filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)',
                            marginLeft: 'auto'
                        }}/>
                    </Button>
                    <Button variant="undefined" style={{
                        boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                        background: 'white',
                        width: '90vw',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center'
                    }} onClick={() => {
                        window.location.href = "https://busify.ro/termsofservice"
                    }}>
                        <TOSIcon style={{marginRight: 10, scale: '0.9'}}/>
                        <div>Termeni de utilizare</div>
                        <ArrowRight style={{
                            filter: 'brightness(0) saturate(100%) invert(68%) sepia(98%) saturate(1%) hue-rotate(359deg) brightness(87%) contrast(93%)',
                            marginLeft: 'auto'
                        }}/>
                    </Button>
                </ButtonGroup>

            <PaywallSheet
                show={showDonationPaywall}
                onHide={() => {
                    setShowDonationPaywall(false);
                }}
            />
        </div>
)
}

export default Settings;