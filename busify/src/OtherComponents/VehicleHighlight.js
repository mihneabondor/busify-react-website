import './BottomBar.css'
import '../Orare/Traseu.css'
import './VehicleHighlight.css'
import {BottomSheet} from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css';
import Marker from "../OtherComponents/Marker";
import CloseButton from "react-bootstrap/esm/CloseButton";
import {ReactComponent as DistanceIcon} from '../Images/distanceIcon.svg'
import React, {useEffect, useRef, useState} from "react";
import Button from "react-bootstrap/esm/Button";
import {ReactComponent as HeartIcon} from '../Images/HeartIconBusHighlight.svg'
import {ReactComponent as LocationIcon} from '../Images/locationIcon.svg'
import {ReactComponent as HeartIconFill} from '../Images/HeartIconBusHighlightFill.svg'
import {ReactComponent as UrmatoareleStatii} from '../Images/urmatoareleStatiiIcon.svg'
import {ReactComponent as OrarIcon} from '../Images/orarIconNoBar.svg'
import {ReactComponent as BiletIcon} from '../Images/biletIcon.svg'
import {ReactComponent as BackIcon} from '../Images/backIcon.svg'
import {ReactComponent as SignalIcon} from '../Images/signalIcon.svg'
import {ReactComponent as SpreIcon} from '../Images/SpreIcon.svg'
import {ReactComponent as DeLaIcon} from '../Images/DeLaIcon.svg'
import {ReactComponent as ShareIcon} from '../Images/ShareIcon.svg'
import {useNavigate, useSearchParams} from "react-router-dom";
import CustomSwitch from "./CustomSwitch";
import {useSheet} from "../Contexts/SheetContext";

function VehicleHighlight(props) {
    const nav = useNavigate()
    const [userVehicleDistState, setUserVehicleDistState] = useState(0)
    const [linieFav, setLinieFav] = useState(false)

    const stopRefs = useRef([]);
    const stopListContainerRef = useRef(null);
    const stopCenteredFirstTimeRef = useRef(false);
    const [selectedStop, setSelectedStop] = useState(null)
    const [selectedStopTime, setselectedStopTime] = useState(0)
    const selectedStopRef = useRef(null);

    const sheetRef = useRef(null);

    const [notificationsScheduled, setNoficationsScheduled] = useState(false);
    const canSendNotification = useRef(false);
    const [hasUserId, setHasUserId] = useState(false);

    const [stops, setStops] = useState([]);

    const {sheetOpen, setSheetOpen} = useSheet();

    const [searchParams] = useSearchParams();

    const isOpen = props.show !== null && props.show !== undefined;

    function calculateDistance(lat1, lon1, lat2, lon2) {
        function toRadians(degrees) {
            return degrees * (Math.PI / 180);
        }

        const R = 6371;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Distance in kilometers

        const signLat = (lat2 - lat1) < 0 ? -1 : 1;
        const signLon = (lon2 - lon1) < 0 ? -1 : 1;

        return distance * signLat * signLon;
    }

    function getNearestStop() {
        const lat = props.vehicleRef?.lngLat[1], lng = props.vehicleRef?.lngLat[0];
        let minimumIndex = 0, minimumDistance = 100;
        for(let i = 0; i < props.stops.length; i++) {
            const dist = Math.abs(calculateDistance(lat, lng, props.stops[i].stop_lat, props.stops[i].stop_lon))
            if (dist < minimumDistance) {
                minimumIndex = i;
                minimumDistance = dist
            }
            if (selectedStopRef.current && selectedStopRef.current.stop_name === props.stops[i].stop_name) {
                setselectedStopTime(Math.floor(Math.abs(dist) / 20 * 60));
            }
        }
        props.setNearestStop(props.stops[minimumIndex]);
        props.nearestStopRef.current = props.stops[minimumIndex];

        if(stopCenteredFirstTimeRef.current === false && props.vehicle) {
            stopCenteredFirstTimeRef.current = true;
            setTimeout(() => {
                const stopEl = stopRefs.current[minimumIndex];
                const container = stopListContainerRef.current;
                if (stopEl && container) {
                    const offsetLeft = stopEl.offsetLeft;
                    const elWidth = stopEl.offsetWidth;
                    const containerWidth = container.offsetWidth;

                    container.scrollLeft = offsetLeft - (containerWidth / 2) + (elWidth / 2);
                }
            }, 100);
        }
    }

    useEffect(() => {
        getNearestStop();

        if (!props.vehicleRef?.lngLat || !props.map.current._controls[2]._lastKnownPosition) return;
        const dist = Math.abs(
            calculateDistance(
                props.map.current._controls[2]._lastKnownPosition.coords.latitude,
                props.map.current._controls[2]._lastKnownPosition.coords.longitude,
                props.vehicleRef.lngLat[1],
                props.vehicleRef.lngLat[0]
            )
        ).toPrecision(1);
        setUserVehicleDistState(dist)
    }, [props.vehicle]);

    useEffect(() => {
        if(props.selectedStop) {
            setSelectedStop(props.selectedStop)
            selectedStopRef.current = props.selectedStop
            try {
                sheetRef.current.snapTo(({minHeight}) => minHeight)
            } catch {}
        }
    }, [props.selectedStop])

    useEffect(() => {
        if(selectedStop || selectedStopRef.current) {
            getNearestStop();
        }
    }, [selectedStop, selectedStopRef])

    useEffect(() => {
        console.log('VehicleHighlight show:', isOpen);
        setSheetOpen(isOpen);
    }, [isOpen, setSheetOpen]);

    useEffect(() => {
        if(localStorage.getItem('linii_favorite')){
            const favorite = localStorage.getItem('linii_favorite').split(' ')
            setLinieFav(favorite.includes(props.vehicleRef?.line))
        }

        let scheduledNotifications = localStorage.getItem('scheduledNotifications') || '[]'
        scheduledNotifications = JSON.parse(scheduledNotifications);
        scheduledNotifications = scheduledNotifications.filter(x =>
            props.vehicleRef?.line === x.vehicle?.line &&
            x.stop?.stop_name === selectedStop?.stop_name
        )
        setNoficationsScheduled(scheduledNotifications.length > 0);
        canSendNotification.current = localStorage.hasOwnProperty('notificationUserId');
        setHasUserId(localStorage.hasOwnProperty('notificationUserId'));

        setStops(props.stops)
    }, [props.show, selectedStop])

    if (!isOpen) return null;

    return (
        <BottomSheet
            ref={sheetRef}
            open={props.show}
            expandOnContentDrag={false}
            scrollLocking={false}
            blocking={false}
            snapPoints={({ minHeight, headerHeight }) => [headerHeight, minHeight]}
            defaultSnap={({ headerHeight }) => headerHeight}
            style={{overflowX: 'scroll'}}
            header={
                <div>
                    <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                        <Marker
                            type={props.vehicle?.vehicleType}
                            name={props.vehicle?.line}
                            label={props.vehicle?.label}
                            minContent={true}
                        />
                        <div style={{textAlign: 'left'}}><b>{props.vehicle?.route}</b></div>
                        <CloseButton style={{marginLeft: 'auto'}} onClick={() => {
                            props.onHide()
                            stopCenteredFirstTimeRef.current = false;
                            setSelectedStop(null);
                            selectedStopRef.current = null;
                            setselectedStopTime(null)
                        }}/>
                    </div>

                    <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                        <div style={{display: "flex", flexDirection: "column"}}>
                            <div style={{
                                marginTop: "10px",
                                color: "gray",
                                textAlign: 'left',
                                alignItems: 'center',
                                display: 'flex',
                            }}>
                                <DeLaIcon/>
                                <div style={{marginLeft: '3px'}}>
                                    pornire:
                                    <b> {props.stops[0]?.stop_name}</b>
                                </div>
                            </div>
                            <div style={{color: "gray", textAlign: 'left', alignItems: 'center', display: 'flex'}}>
                                <SpreIcon/>
                                <div style={{marginLeft: '3px'}}>
                                    capăt:
                                    <b> {props.stops[props.stops?.length - 1]?.stop_name}</b>
                                </div>
                            </div>
                        </div>
                        <div style={{marginLeft: 'auto', borderRadius: '100%', background: linieFav ? "#FBF3F3" : "#F5F6F8", padding: "10px"}} onClick={()=>{
                            let linii = localStorage.getItem('linii_favorite');
                            let favorites = linii ? linii.trim().split(/\s+/) : [];

                            const line = String(props.vehicleRef.line);

                            if (favorites.includes(line)) {
                                favorites = favorites.filter(l => l !== line);
                            } else {
                                favorites.push(line);
                            }

                            localStorage.setItem('linii_favorite', favorites.join(' '));
                            setLinieFav(favorites.includes(line));
                        }}>
                            {linieFav ?
                                <HeartIconFill style={{
                                    filter: "filter: brightness(0) saturate(100%) invert(57%) sepia(45%) saturate(5208%) hue-rotate(327deg) brightness(93%) contrast(90%);",
                                }}/>
                                : <HeartIcon
                                    style={{filter: "brightness(0) saturate(100%)"}}/>
                            }
                        </div>
                    </div>

                    <div style={{
                        display: props.map.current?._controls[2]?._lastKnownPosition ? "flex" : "none",
                        flexDirection: "row",
                        alignItems: "center",
                        color: 'gray',
                        marginTop: '10px',
                    }}>
                        <DistanceIcon/>
                        <div style={{marginLeft: '5px'}}>la {userVehicleDistState} KM depărtare
                            ({Math.floor(userVehicleDistState / 20 * 60)} min)
                        </div>
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: 'space-evenly',
                        alignItems: "center",
                        marginTop: '10px',
                    }}>
                        <Button variant="secondary" style={{
                            background: "#F5F6F8",
                            color: 'black',
                            border: "none",
                            display: 'flex',
                            alignItems: "center",
                            justifyContent: 'center',
                        }} onClick={() => {
                            sheetRef.current.snapTo(({headerHeight}) => headerHeight)
                            props.map.current.flyTo({
                                center: props.vehicle.lngLat,
                                duration: 1000,
                                zoom: 14,
                                essential: true
                            })
                        }}>
                            <LocationIcon
                                style={{filter: "brightness(0) saturate(100%)", scale: "0.9", marginRight: '5px'}}/>
                            Urmărește
                        </Button>
                        <Button
                            variant="secondary"
                            style={{
                                background: "#F5F6F8",
                                color: 'black',
                                border: "none",
                                display: 'flex',
                                alignItems: "center",
                                justifyContent: 'center',
                            }}
                            onClick={() => {
                                const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
                                const message = props.vehicle?.line || '';
                                const phoneNumber = '7479';

                                let smsLink;

                                if (isIOS) {
                                    smsLink = `sms:${phoneNumber}&body=${encodeURIComponent(message)}`;
                                    window.location.href = smsLink;
                                } else {
                                    smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
                                    window.open(smsLink, '_blank');
                                }
                            }}
                        >
                            <BiletIcon style={{ marginRight: '5px' }} />
                            Bilet
                        </Button>

                        <Button variant="secondary" style={{
                            background: "#F5F6F8",
                            color: 'black',
                            // flex: '1',
                            border: "none",
                            display: 'flex',
                            alignItems: "center",
                            justifyContent: 'center',
                            outline: 'none'
                        }} onClick={() => {
                            navigator.clipboard.writeText(`https://app.busify.ro/map?id=${props.vehicle.label}`).then(props.copyLinkNotification)
                        }}>
                            <ShareIcon style={{marginRight: '5px'}}/>
                            Distribuie
                        </Button>
                    </div>
                </div>
            }
        >
                <div style={{margin: "15px", overflow: "hidden"}}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: '15px'
                }}>
                    <UrmatoareleStatii style={{marginRight: '5px'}}/>
                    <b>Următoarele stații</b>
                </div>

                <div style={{display: selectedStop ? 'none' : 'flex'}} ref={stopListContainerRef}
                     className={`stop-list-scroll`}>
                    <div className="d-flex align-items-start position-relative"
                         style={{width: 'min-content', marginTop: '15px'}}>
                        {stops.map((step, index) => (
                            <div
                                key={step.number}
                                ref={el => stopRefs.current[index] = el}
                                className="d-flex flex-column align-items-center text-center position-relative"
                                style={{width: "125px"}}
                            >
                                {index > 0 && (
                                    <div
                                        className="position-absolute bg-secondary"
                                        style={{
                                            width: "100%",
                                            height: "2px",
                                            left: "-50%",
                                            top: "18px",
                                            zIndex: 0,
                                        }}
                                    ></div>
                                )}

                                <div
                                    className="d-flex align-items-center justify-content-center rounded-circle fw-bold border position-relative"
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        border: "2px solid #ccc",
                                        background: props.neareastStop === step ? '#915FA8' : '#F5F6F8',
                                        color: props.neareastStop === step ? 'white' : 'black',
                                        zIndex: 1,
                                    }}
                                    onClick={() => {
                                        selectedStopRef.current = step;
                                        setSelectedStop(step)
                                        getNearestStop()
                                    }}
                                >
                                    {index + 1}
                                </div>

                                <div className="mt-2"
                                     style={{
                                         maxWidth: 'max-content',
                                         textAlign: 'center',
                                         wordBreak: 'normal',
                                         whiteSpace: 'normal',
                                         color: props.nearestStop === step ? '#915FA8' : 'gray'
                                     }}>
                                    {step.stop_name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{display: selectedStop ? 'flex' : 'none', flexDirection: 'column'}}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        marginTop: '10px',
                        width: '100%',
                        alignItems: 'center'
                    }}>
                        <BackIcon onClick={() => {
                            setSelectedStop(null)
                            selectedStopRef.current = null
                            setselectedStopTime(null)
                            getNearestStop()
                        }}/>
                        <div style={{marginLeft: '15px'}}><b>{selectedStop?.stop_name}</b></div>
                        <div style={{marginLeft: 'auto', display: 'flex', flexDirection: 'row', alignItems: "stretch"}}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontFamily: 'sans-serif',
                                fontSize: '14px',
                                color: '#333'
                            }}>
                                <div style={{
                                    color: selectedStopTime <= 5 ? '#0FBE7E' : selectedStopTime <= 10 ? '#E7CD35' : '#FF0C0B',
                                    fontSize: '26px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginRight: '6px'
                                }}>
                                    <span style={{marginRight: '4px'}}>
                                        {selectedStopTime}
                                    </span>
                                    <SignalIcon style={{
                                        marginBottom: '25px',
                                        filter: selectedStopTime <= 5 ? 'brightness(0) saturate(100%) invert(51%) sepia(96%) saturate(383%) hue-rotate(107deg) brightness(95%) contrast(96%)' : selectedStopTime <= 10 ? 'brightness(0) saturate(100%) invert(67%) sepia(77%) saturate(371%) hue-rotate(11deg) brightness(100%) contrast(103%)' : 'brightness(0) saturate(100%) invert(20%) sepia(99%) saturate(6388%) hue-rotate(357deg) brightness(110%) contrast(107%)',
                                    }}/>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', lineHeight: '1.2'}}>
                                    <span>minute</span>
                                    <span>depărtare</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', marginTop: '10px'}}>
                        <div>Notifică apropierea vehiculului de stație</div>
                        <CustomSwitch
                            style={{marginLeft: 'auto'}}
                            checked={notificationsScheduled}
                            disabled={!hasUserId}
                            onChange={() => {
                                setNoficationsScheduled(!notificationsScheduled);

                                let scheduledNotifications = localStorage.getItem('scheduledNotifications') || '[]'
                                scheduledNotifications = JSON.parse(scheduledNotifications)

                                const notificationExists = scheduledNotifications.some(
                                    item => item.vehicle?.line === props.vehicleRef?.line &&
                                        item.stop?.stop_name === selectedStop?.stop_name
                                );

                                if (notificationExists) {
                                    scheduledNotifications = scheduledNotifications.filter(
                                        item => !(item.vehicle?.line === props.vehicleRef?.line &&
                                            item.stop?.stop_name === selectedStop?.stop_name)
                                    );
                                } else {
                                    scheduledNotifications.push({
                                        vehicle: props.vehicleRef,
                                        stop: selectedStop
                                    });
                                }

                                localStorage.setItem('scheduledNotifications', JSON.stringify(scheduledNotifications))
                                props.socket.current.emit(
                                    'notifications',
                                    localStorage.getItem('notificationUserId'),
                                    props.vehicleRef,
                                    selectedStop
                                );
                            }}
                        />
                    </div>
                    <small style={{display: !hasUserId ? "initial" : "none", color: 'gray'}}>
                        * Notificările aplicației trebuie să fie pornite!
                    </small>
                </div>
                <hr/>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <Button style={{
                        flex: '1',
                        display: 'flex',
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#8B56A4",
                        border: 'none'
                    }} onClick={() => {
                        props.onHide()
                        stopCenteredFirstTimeRef.current = false;
                        setSelectedStop(null);
                        selectedStopRef.current = null;
                        setselectedStopTime(null)
                        nav(`/orare/${props.vehicle?.line}`)
                    }}>
                        <OrarIcon style={{marginRight: '5px'}}/>
                        <b>Vezi orarul liniei {props.vehicle?.line}</b>
                    </Button>
                    {/*<Button style={{*/}
                    {/*    flex: '1',*/}
                    {/*    marginTop: '15px',*/}
                    {/*    background: 'white',*/}
                    {/*    color: 'black',*/}
                    {/*    border: "1px solid #DDCCE5", display: 'flex', alignItems: "center", justifyContent: "center",}} href={`sms:7479&body=${props.vehicle?.line}`}>*/}
                    {/*    <BiletIcon style={{marginRight: '5px'}}/>*/}
                    {/*    <b>Cumpără bilet</b>*/}
                    {/*</Button>*/}
                </div>
            </div>
        </BottomSheet>
    )
}

export default VehicleHighlight;