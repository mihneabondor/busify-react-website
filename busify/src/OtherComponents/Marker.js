import '../Orare/Orare.css';

import {ReactComponent as BusIcon} from '../Images/busIcon.svg';
import {ReactComponent as TroleibusIcon} from '../Images/troleibusIcon.svg';
import {ReactComponent as TramvaiIcon} from '../Images/tramvaiIcon.svg';
import {useEffect, useState, useMemo} from "react";
import {useRef, useLayoutEffect} from "react";

function Marker(props) {
    const [text, setText] = useState(props.name);
    const [iconite, setIconite] = useState(true);
    const badgeRef = useRef(null);
    const [badgeWidth, setBadgeWidth] = useState(70);
    const [badgeDims, setBadgeDims] = useState({ width: 70, height: 40 }); // default

    useLayoutEffect(() => {
        if (badgeRef.current) {
            const { width, height } = badgeRef.current.getBoundingClientRect();
            setBadgeDims({ width, height });
        }
    }, [text, props.name, props.iconite]);


    // Bearing helper
    function getBearing(lat1, lon1, lat2, lon2) {
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;

        const dLon = toRad(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
        const bearing = toDeg(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    function getOffsetFromBearing(bearing, distance) {
        const angleRad = bearing * Math.PI / 180;
        return {
            dx: distance * Math.sin(angleRad),
            dy: -distance * Math.cos(angleRad) // y-axis is inverted in CSS
        };
    }

    const arrowPosition = useMemo(() => {
        if (props.vehiclePos && props.nextPos) {
            const bearing = getBearing(
                props.vehiclePos.lat,
                props.vehiclePos.lng,
                props.nextPos.lat,
                props.nextPos.lng
            );

            const horizontalFactor = Math.abs(Math.cos(bearing * Math.PI / 180));

            // 🔧 Distance is shorter when iconite is false
            const baseDistance = props.iconite === "false" ? 25 : 30;
            const extraPadding = props.iconite === "false" ? 6 : 10;

            const dynamicDistance = baseDistance + extraPadding * (1 - horizontalFactor);
            const { dx, dy } = getOffsetFromBearing(bearing, dynamicDistance);

            return { bearing, dx, dy };
        }
        return { bearing: 0, dx: 0, dy: 0 };
    }, [props.vehiclePos, props.nextPos, props.iconite]);

    useEffect(() => {
        if(localStorage.hasOwnProperty("iconite")){
            setIconite(localStorage.getItem("iconite") === "true");
        }
    }, [])

    return (
        <div className="marker-container"
             style={{position: 'relative', display: props.hidden ? 'none' : 'inline-block'}}>
            <div
                ref={badgeRef}
                className={`orare-cell-badge ${props.type}`}
                style={{
                    width: props.minContent ? "initial" : "70px",
                    display: "flex",
                    outline: props.outline ? '2px solid white' : "none",
                    boxShadow: 'rgba(255, 255, 255, 0.1) 0px 1px 1px 0px inset, rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onClick={() => {
                    if (props.label) {
                        setText(props.label);
                        setTimeout(() => {
                            setText(props.name);
                        }, 2000);
                    }
                }}
            >
                {props.iconite === "true" || props.iconite === undefined ? (
                    <div className='orare-cell-badge-icon'>
                        {props.type === 'troleibuze' ? (
                            <TroleibusIcon style={{maxWidth: "80%"}}/>
                        ) : props.type === 'autobuze' ? (
                            <BusIcon style={{maxWidth: "80%"}}/>
                        ) : (
                            <TramvaiIcon style={{maxWidth: "80%"}}/>
                        )}
                    </div>
                ) : null}
                <div className={props.iconite === "true" || props.iconite === undefined ? 'orare-cell-badge-text' : ""}>
                    <b>{text}</b>
                </div>
            </div>

            <div
                style={{
                    display: props.vehiclePos && props.nextPos && props.sageti === "true" ? "initial" : "none",
                    position: 'absolute',
                    left: `${(badgeDims.width / 2) + arrowPosition.dx - (41 / 2)}px`,
                    top: `${(badgeDims.height / 2) + arrowPosition.dy - (41 / 2)}px`,
                    transform: `rotate(${arrowPosition.bearing}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.7s ease, top 0.7s ease, left 0.7s ease',
                    pointerEvents: 'none',
                    width: '41px',
                    height: '41px',
                }}
            >
                <img
                    src={
                        props.type === "autobuze"
                            ? require('../Images/BusArrowIcon.png')
                            : props.type === "troleibuze"
                                ? require('../Images/TroleibusArrowIcon.png')
                                : require('../Images/TramArrowIcon.png')
                    }
                    alt=""
                    style={{width: '100%', height: '100%'}}
                />
            </div>
        </div>
    );
}

export default Marker;