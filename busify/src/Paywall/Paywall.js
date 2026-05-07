import React, {useEffect, useRef, useState} from "react";

import logo from "../Images/Logo/logo512.png";
import {ButtonGroup} from "react-bootstrap";
import Button from "react-bootstrap/Button";

import {IoCheckmarkCircle} from "react-icons/io5";
import {FaRegCircle} from "react-icons/fa";
import {GrAppsRounded} from "react-icons/gr";
import {FaRegStar} from "react-icons/fa";
import {HiOutlineAdjustments} from "react-icons/hi";
import CloseButton from "react-bootstrap/CloseButton";
import Spinner from "react-bootstrap/Spinner";
import Confetti from 'react-confetti'
import {GoDotFill} from "react-icons/go";

export default function Paywall(props) {
    const [selected, setSelected] = useState("5lei");
    const [message, setMessage] = useState(null);
    const messageRef = useRef(null);
    const [subscription, setSubscription] = useState(null);
    const [icon, setIcon] = useState('logo512');

    useEffect(() => {
        setMessage(null);
        if (localStorage.hasOwnProperty("app_icon")) {
            setIcon(localStorage.getItem("app_icon"));
        } else {
            localStorage.setItem("app_icon", "logo512");
            setIcon("logo512");
        }
        setSubscription(JSON.parse(localStorage.getItem("active_subscription")));

        const handleSubscriptionUpdate = (message) => {
            try {
                // Parse message if it's a string, otherwise use directly
                const parsedMessage = typeof message === 'string' ? JSON.parse(message) : message;
                setMessage(parsedMessage);
                messageRef.current = parsedMessage;

                if (parsedMessage.status === "success" || parsedMessage.status === "no_active_subscription") {
                    setSubscription(parsedMessage.status === "success" ? parsedMessage : null);
                    localStorage.setItem("active_subscription", JSON.stringify(parsedMessage.status === "success" ? parsedMessage : null));
                }
            } catch (e) {
                setMessage({status: "error", error: "Error processing update: " + e.message});
            }
        };

        // 1. iOS Listener (Already present)
        window.receiveStatusUpdateFromiOS = handleSubscriptionUpdate;

        // 2. ANDROID Listener (NEW)
        window.receiveStatusUpdateFromAndroid = handleSubscriptionUpdate;

        return () => {
            // Clean up both listeners
            delete window.receiveStatusUpdateFromiOS;
            delete window.receiveStatusUpdateFromAndroid;
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

    const isRunningInAndroidApp = () => {
        // Check if the Android Bridge object is available
        return window.AndroidBridge && typeof window.AndroidBridge.postMessage === 'function';
    }

    const isRunningIniOSApp = () => {
        // Check for iOS webkit message handler
        return window.webkit?.messageHandlers?.donationHandler;
    }


    return (
        <div style={{
            width: "100%",
            background: "#F6F8FA",
            height: "100dvh",
            overflow: 'auto',
            paddingBottom: "120px"
        }}>
            {
                subscription ? <Confetti numberOfPieces={30}/> : null
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
                    <img src={logo} alt="Logo" style={{width: 100, height: 100, borderRadius: "15px", margin: '20px'}}/>
                </div>
                <div style={{textAlign: "center", marginBottom: '20px'}}>
                    {
                        subscription ? (
                            <div>
                                Mulțumim pentru susținere și încredere! 😎 <br/> Ne ești alături
                                din <strong>{formatRomanianDate(subscription.purchaseDate)}</strong>!
                            </div>
                        ) : (
                            "Susține dezvoltarea proiectului Busify prin donații accesibile!"
                        )
                    }
                </div>

                {
                    !subscription ?
                        <ButtonGroup vertical style={{marginBottom: '20px'}}>
                            <Button variant="undefined" style={{
                                boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
                                background: 'white',
                                width: '90vw',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }} onClick={() => {
                                setSelected("5lei")
                            }}>
                                {
                                    selected === "5lei" ?
                                        <IoCheckmarkCircle style={{color: '#8B56A4', scale: '1.5'}}/> :
                                        <FaRegCircle style={{color: '#8B56A4', scale: '1.3'}}/>
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
                            }} onClick={() => {
                                setSelected("10lei")
                            }}>
                                {
                                    selected === "10lei" ?
                                        <IoCheckmarkCircle style={{color: '#8B56A4', scale: '1.5'}}/> :
                                        <FaRegCircle style={{color: '#8B56A4', scale: '1.3'}}/>
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
                            }} onClick={() => {
                                setSelected("25lei")
                            }}>
                                {
                                    selected === "25lei" ?
                                        <IoCheckmarkCircle style={{color: '#8B56A4', scale: '1.5'}}/> :
                                        <FaRegCircle style={{color: '#8B56A4', scale: '1.3'}}/>
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
                            }} onClick={() => {
                                setSelected("50lei")
                            }}>
                                {
                                    selected === "50lei" ?
                                        <IoCheckmarkCircle style={{color: '#8B56A4', scale: '1.5'}}/> :
                                        <FaRegCircle style={{color: '#8B56A4', scale: '1.3'}}/>
                                }
                                <div style={{marginLeft: '10px'}}>Donație de 50 lei</div>
                                <div style={{marginLeft: 'auto'}}>49.99 ron/lună</div>
                            </Button>
                        </ButtonGroup>
                        : null
                }

                <small style={{color: 'gray'}}>
                    Personalizează iconița
                </small>
                <div
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        gap: "30px",
                        padding: "10px 0 20px 0"
                    }}
                >
                    {['logo512', 'beta', 'retro', 'snow', 'turbo'].map(item => (
                        <div
                            key={item}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                minWidth: "80px"
                            }}
                            onClick={() => {
                                if (!subscription) {
                                    setMessage({
                                        "status": "error",
                                        "error": "Personalizarea iconiței este destinată exclusiv donatorilor!"
                                    })
                                    return;
                                }
                                localStorage.setItem("app_icon", item)
                                setIcon(item)
                                const message = {
                                    type: "ICON_CHANGE",
                                    icon: item
                                };

                                if (isRunningIniOSApp()) {
                                    // iOS
                                    window.webkit.messageHandlers.iconHandler.postMessage(message);
                                } else if (isRunningInAndroidApp()) {
                                    // Android
                                    window.AndroidBridge.postMessage(JSON.stringify(message));
                                    setMessage({status: "waiting"});
                                }
                            }}
                        >
                            <img
                                src={require(`../Images/Logo/${item}.png`)}
                                alt={item}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    objectFit: "contain",
                                    borderRadius: "10px",
                                }}
                            />
                            <div style={{padding: '5px 0 0 0'}}>
                                {
                                    icon === item ?
                                        <IoCheckmarkCircle style={{color: '#8B56A4', scale: '1.5'}}/> :
                                        <FaRegCircle style={{color: '#8B56A4', scale: '1.3'}}/>
                                }
                            </div>
                        </div>
                    ))}
                </div>


                <div style={{textAlign: "left", display: 'flex', justifyContent: 'left'}}>
                    <small style={{color: 'gray'}}>
                        Beneficii exclusive pentru donatori
                    </small>
                </div>
                <ButtonGroup vertical style={{marginBottom: '20px'}}>
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
                                <GrAppsRounded style={{
                                    background: '#8B56A4',
                                    color: 'white',
                                    borderRadius: '3px',
                                    padding: '3px',
                                    scale: '1.3',
                                    marginRight: '10px'
                                }}/>
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
                                <FaRegStar style={{
                                    background: '#8B56A4',
                                    color: 'white',
                                    borderRadius: '3px',
                                    padding: '3px',
                                    scale: '1.3',
                                    marginRight: '10px'
                                }}/>
                                <div>
                                    Iconiță personalizată
                                </div>
                            </div>
                            <small style={{color: 'gray'}}>
                                Donatorii vor putea alege dintr-o varietate de iconițe predefinite cu
                                diferite tematici.
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
                                <HiOutlineAdjustments style={{
                                    background: '#8B56A4',
                                    color: 'white',
                                    borderRadius: '3px',
                                    padding: '3px',
                                    scale: '1.3',
                                    marginRight: '10px'
                                }}/>
                                <div>
                                    Feedback prioritar
                                </div>
                            </div>
                            <small style={{color: 'gray'}}>
                                Cerințele și dorințele donatorilor vor avea prioritate în viitorul dezvoltării
                                aplicației.
                            </small>
                        </div>
                    </Button>
                </ButtonGroup>

                <div style={{textAlign: "left", display: 'flex', justifyContent: 'left'}}>
                    <small style={{color: 'gray'}}>
                        Roadmap
                    </small>
                </div>
                <ButtonGroup vertical>
                    <Button variant="undefined" style={{background: "white", textAlign: "left"}}>
                        <GoDotFill style={{marginRight: '5px', color: '#8B56A4'}}/>
                        Propriul sistem de direcții și indicații pas cu pas
                    </Button>
                    <Button variant="undefined" style={{background: "white", textAlign: "left"}}>
                        <GoDotFill style={{marginRight: '5px', color: '#8B56A4'}}/>
                        Implementarea unei soluții pentru marker-ele care se suprapun pe hartă
                    </Button>
                    <Button variant="undefined" style={{background: "white", textAlign: "left"}}>
                        <GoDotFill style={{marginRight: '5px', color: '#8B56A4'}}/>
                        Optimizarea semnificativă hărții
                    </Button>
                    <Button variant="undefined" style={{background: "white", textAlign: "left"}}>
                        <GoDotFill style={{marginRight: '5px', color: '#8B56A4'}}/>
                        Integrare 24Pay sau o metodă proprie pentru cumpărarea unui bilet
                    </Button>
                    <Button variant="undefined" style={{background: "white", textAlign: "left"}}>
                        <GoDotFill style={{marginRight: '5px', color: '#8B56A4'}}/>
                        Extindere în alte orașe
                    </Button>
                </ButtonGroup>
            </div>


            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    position: "fixed",
                    bottom: 0,
                    zIndex: 9999,
                    width: '100%',
                    background: "white",
                    paddingTop: "15px",
                    boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px"
                }}
            >

                {
                    message ? message.status === "error" ? <div style={{
                        color: 'red',
                        textAlign: 'center',
                        marginBottom: '10px'
                    }}>{message.error}</div> : null : null
                }

                {
                    !subscription ?
                        <Button
                            variant="undefined"
                            style={{
                                backgroundColor: '#8B56A4',
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 8,
                                boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
                                margin: "0 20px"
                            }}
                            onClick={() => {
                                const amount = selected.replace("lei", "").trim();

                                const message = {
                                    type: "DONATION_REQUEST",
                                    amount: amount
                                };

                                if (isRunningIniOSApp()) {
                                    // iOS Integration
                                    window.webkit.messageHandlers.donationHandler.postMessage(message);
                                    setTimeout(() => {
                                        if (messageRef.current === null) {
                                            setMessage({
                                                status: "error",
                                                error: "Asigura-te ca aplicația este la zi!"
                                            }, 2000)
                                        }
                                    })
                                } else if (isRunningInAndroidApp()) {
                                    window.AndroidBridge.postMessage(JSON.stringify(message));
                                    setMessage({status: "waiting"});
                                } else {
                                    setMessage({
                                        status: "error",
                                        error: "Abonamentele se pot realiza doar în interiorul aplicației de mobil. Asigură-te că aceasta este la zi!"
                                    })
                                }
                            }}
                        >
                            {
                                message?.status === "waiting" ? <Spinner
                                    animation="border"/> : message?.status === "success" ? "Succes" : message?.status === "error" ? "Eroare :(" : "Continuă"
                            }
                        </Button>
                        : null
                }

                {
                    !subscription ?
                        <Button
                            variant={'undefined'}
                            style={{color: 'gray'}}
                            onClick={() => {
                                if (isRunningIniOSApp()) {
                                    window.webkit.messageHandlers.restoreHandler.postMessage({
                                        type: "RESTORE_REQUEST"
                                    });
                                    setMessage({status: "waiting"});
                                } else if (isRunningInAndroidApp()) {
                                    window.AndroidBridge.postMessage(JSON.stringify({
                                        type: "RESTORE_PURCHASES"
                                    }));
                                    setMessage({status: "waiting"});
                                } else {
                                    alert("Restore este disponibil doar în aplicația iOS / Android.");
                                }
                            }}
                        >
                            <small>Restore purchases</small>
                        </Button>
                        : null
                }
            </div>
        </div>
    )
}