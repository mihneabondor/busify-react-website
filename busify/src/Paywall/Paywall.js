import React, { useEffect, useState } from "react";

import logo from "../Images/Logo/logo512.png";
import {ButtonGroup} from "react-bootstrap";
import Button from "react-bootstrap/Button";

import { IoCheckmarkCircle } from "react-icons/io5";
import { FaRegCircle } from "react-icons/fa";
import { GrAppsRounded } from "react-icons/gr";
import { FaRegStar } from "react-icons/fa";
import { HiOutlineAdjustments } from "react-icons/hi";
import CloseButton from "react-bootstrap/CloseButton";
import Spinner from "react-bootstrap/Spinner";
import Confetti from 'react-confetti'

export default function Paywall(props) {
    const [selected, setSelected] = useState("5lei");
    const [message, setMessage] = useState(null);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        setSubscription(JSON.parse(localStorage.getItem("active_subscription")));

        window.receiveStatusUpdateFromiOS = (message) => {
            try {
                setMessage(message)

                if(message.status === "success") {
                    setSubscription(message);
                    localStorage.setItem("active_subscription", JSON.stringify(message));
                }
            } catch (e) {
                setMessage(e)
            }
        };

        return () => {
            delete window.receiveStatusUpdateFromiOS;
        };
    }, []);

    const formatRomanianDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString("ro-RO", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };


    return(
        <div style={{
            width:"100%",
            background: "#F6F8FA",
            height:"100dvh",
            overflow: 'auto',
        }}>
            {
                subscription ? <Confetti numberOfPieces = {100}/> : null
            }
            <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "10px 20px"
            }}>
                <CloseButton onClick={props.onHide}/>
            </div>
            <div style={{
                margin: '0 20px',
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{display: "flex", justifyContent: 'center'}}>
                    <img src={logo} alt="Logo" style={{ width: 100, height: 100, borderRadius: "15px", margin:'20px' }} />
                </div>
                <div style={{textAlign:"center", marginBottom:'20px'}}>
                    {
                        subscription ? (
                            <div>
                                Mulțumim pentru susținere și încredere! 😎 <br/> Ești donator din <strong>{formatRomanianDate(subscription.purchaseDate)}</strong>!
                            </div>
                        ) : (
                            "Susține dezvoltarea proiectului Busify prin donații accesibile!"
                        )
                    }
                </div>

                {
                    !subscription ?
                    <ButtonGroup vertical style={{marginBottom:'20px'}}>
                        <Button variant="undefined" style={{
                            boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                            background: 'white',
                            width: '90vw',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }} onClick={() => {setSelected("5lei")}}>
                            {
                                selected === "5lei" ?
                                    <IoCheckmarkCircle style={{color: '8B56A4', scale: '1.5'}} /> : <FaRegCircle style={{color: '8B56A4', scale: '1.3'}} />
                            }
                            <div style={{marginLeft: '10px'}}>Donație de 5 lei</div>
                            <div style={{marginLeft: 'auto'}}>4.99 ron/lună</div>
                            <hr/>
                        </Button>
                        <Button variant="undefined" style={{
                            boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                            background: 'white',
                            width: '90vw',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }} onClick={() => {setSelected("10lei")}}>
                            {
                                selected === "10lei" ?
                                    <IoCheckmarkCircle style={{color: '8B56A4', scale: '1.5'}} /> : <FaRegCircle style={{color: '8B56A4', scale: '1.3'}} />
                            }
                            <div style={{marginLeft: '10px'}}>Donație de 10 lei</div>
                            <div style={{marginLeft: 'auto'}}>9.99 ron/lună</div>
                        </Button>
                        <Button variant="undefined" style={{
                            boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                            background: 'white',
                            width: '90vw',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }} onClick={() => {setSelected("25lei")}}>
                            {
                                selected === "25lei" ?
                                    <IoCheckmarkCircle style={{color: '8B56A4', scale: '1.5'}} /> : <FaRegCircle style={{color: '8B56A4', scale: '1.3'}} />
                            }
                            <div style={{marginLeft: '10px'}}>Donație de 25 lei</div>
                            <div style={{marginLeft: 'auto'}}>24.99 ron/lună</div>
                        </Button>
                        <Button variant="undefined" style={{
                            boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                            background: 'white',
                            width: '90vw',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }} onClick={() => {setSelected("50lei")}}>
                            {
                                selected === "50lei" ?
                                    <IoCheckmarkCircle style={{color: '8B56A4', scale: '1.5'}} /> : <FaRegCircle style={{color: '8B56A4', scale: '1.3'}} />
                            }
                            <div style={{marginLeft: '10px'}}>Donație de 50 lei</div>
                            <div style={{marginLeft: 'auto'}}>49.99 ron/lună</div>
                        </Button>
                    </ButtonGroup>
                        : null
                }

                <div style={{textAlign:"left", display: 'flex', justifyContent: 'left'}}>
                    <small style={{color: 'gray'}}>
                        Beneficii exclusive pentru donatori
                    </small>
                </div>

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
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <GrAppsRounded style={{background: '#8B56A4', color: 'white', borderRadius: '3px', padding: '3px', scale: '1.3', marginRight: '10px'}}/>
                                <div>
                                    Acces anticipat la funcții noi
                                </div>
                            </div>
                            <small style={{color: 'gray'}}>
                                Vă invităm să ne fiți alături și să testați funcțiile noi chiar în timp ce le construim!
                            </small>
                        </div>
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
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <FaRegStar style={{background: '#8B56A4', color: 'white', borderRadius: '3px', padding: '3px', scale: '1.3', marginRight: '10px'}}/>
                                <div>
                                    Iconiță personalizată
                                </div>
                            </div>
                            <small style={{color: 'gray'}}>
                                În curând, donatorii vor putea alege dintr-o varietate de iconițe predefinite cu diferite tematici.
                            </small>
                        </div>
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
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <HiOutlineAdjustments style={{background: '#8B56A4', color: 'white', borderRadius: '3px', padding: '3px', scale: '1.3', marginRight: '10px'}}/>
                                <div>
                                    Feedback prioritar
                                </div>
                            </div>
                            <small style={{color: 'gray'}}>
                                Cerințele și dorințele donatorilor vor avea prioritate în viitorul dezvoltării aplicației.
                            </small>
                        </div>
                    </Button>
                </ButtonGroup>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    margin: '20px'
                }}
            >
                {
                    !subscription ?
                <Button
                    variant="undefined"
                    style={{
                        backgroundColor: '#8B56A4',
                        color: 'white',
                        fontWeight: 'bold',
                        borderRadius: 8,
                        boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
                    }}
                    onClick={() => {
                        const amount = selected.replace("lei", "").trim();

                        const message = {
                            type: "DONATION_REQUEST",
                            amount: amount
                        };

                        if (window.webkit?.messageHandlers?.donationHandler) {
                            window.webkit.messageHandlers.donationHandler.postMessage(message);
                        } else {
                            alert("Abonamentele se pot realiza doar in interiorul aplicatiei de pe iOS sau Android.")
                            console.log("Not in iOS WebView");
                        }
                    }}
                >
                    {
                        message ? message.status === "waiting" ? <Spinner animation="border" /> : message.status === "success" ? "Succes" : message.status === "error" ? "Eroare :(" : "Continua" : "Continuă"
                    }
                </Button>
                        : null
                }

                {
                    !subscription ?
                        <Button
                            variant={'undefined'}
                            style={{ color: 'gray' }}
                            onClick={() => {
                                if (window.webkit?.messageHandlers?.restoreHandler) {
                                    window.webkit.messageHandlers.restoreHandler.postMessage({
                                        type: "RESTORE_REQUEST"
                                    });
                                } else {
                                    alert("Restore este disponibil doar în aplicația iOS / Android.");
                                }
                            }}
                        >
                            <small>Restore purchases</small>
                        </Button>
                        : null
                }

                {
                    message ? message.status === "error" ? message.error : null : null
                }
            </div>
        </div>
    )
}