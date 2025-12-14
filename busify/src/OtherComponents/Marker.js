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
    const [badgeDims, setBadgeDims] = useState({ width: 70, height: 26 }); // default

    useLayoutEffect(() => {
        if (badgeRef.current) {
            const { width, height } = badgeRef.current.getBoundingClientRect();
            // Only update if we got valid dimensions (element is visible)
            if (width > 0 && height > 0) {
                setBadgeDims({ width, height });
            }
        }
    }, [text, props.name, props.iconite]);

    // Re-check dimensions periodically for markers that started off-screen
    useEffect(() => {
        const checkDimensions = () => {
            if (badgeRef.current) {
                const { width, height } = badgeRef.current.getBoundingClientRect();
                if (width > 0 && height > 0) {
                    setBadgeDims(prev => {
                        // Only update if dimensions actually changed
                        if (prev.width !== width || prev.height !== height) {
                            return { width, height };
                        }
                        return prev;
                    });
                }
            }
        };

        // Check after a short delay and then periodically
        const timeoutId = setTimeout(checkDimensions, 100);
        const intervalId = setInterval(checkDimensions, 1000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, []);


    // Bearing helper - calculates compass bearing from point 1 to point 2
    // Returns degrees clockwise from north (0-360)
    function getBearing(lat1, lon1, lat2, lon2) {
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;

        const lat1Rad = toRad(lat1);
        const lat2Rad = toRad(lat2);
        const dLon = toRad(lon2 - lon1);

        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

        const bearing = toDeg(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    const arrowPosition = useMemo(() => {
        if (props.vehiclePos && props.nextPos) {
            // Check if points are far enough apart to calculate meaningful bearing
            const latDiff = Math.abs(props.nextPos.lat - props.vehiclePos.lat);
            const lngDiff = Math.abs(props.nextPos.lng - props.vehiclePos.lng);

            // If points are too close (less than ~1 meter), don't show arrow
            if (latDiff < 0.00001 && lngDiff < 0.00001) {
                return { bearing: 0, dx: 0, dy: 0, valid: false };
            }

            const bearing = getBearing(
                props.vehiclePos.lat,
                props.vehiclePos.lng,
                props.nextPos.lat,
                props.nextPos.lng
            );

            const angleRad = bearing * Math.PI / 180;

            // Badge dimensions
            const halfWidth = badgeDims.width / 2;
            const halfHeight = badgeDims.height / 2;
            const arrowRadius = 20.5; // Half of arrow size (41/2)
            const gap = 3; // Gap between badge edge and arrow

            // Direction components (bearing is from north, clockwise)
            // sin(bearing) = x component, cos(bearing) = y component (but inverted for CSS)
            const dirX = Math.sin(angleRad);
            const dirY = -Math.cos(angleRad);

            // Calculate distance to badge edge in this direction
            // For a rectangle, we need to find where the ray intersects the edge
            let edgeDistance;

            if (Math.abs(dirX) < 0.001) {
                // Nearly vertical - use height
                edgeDistance = halfHeight;
            } else if (Math.abs(dirY) < 0.001) {
                // Nearly horizontal - use width
                edgeDistance = halfWidth;
            } else {
                // Calculate intersection with rectangle edges
                const tX = halfWidth / Math.abs(dirX);
                const tY = halfHeight / Math.abs(dirY);
                edgeDistance = Math.min(tX, tY);
            }

            // Total distance from center to arrow center
            const totalDistance = edgeDistance + gap + arrowRadius;

            const dx = totalDistance * dirX;
            const dy = totalDistance * dirY;

            return { bearing, dx, dy, valid: true };
        }
        return { bearing: 0, dx: 0, dy: 0, valid: false };
    }, [props.vehiclePos, props.nextPos, badgeDims]);

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
                className="marker-arrow"
                data-bearing={arrowPosition.bearing}
                data-dx={arrowPosition.dx}
                data-dy={arrowPosition.dy}
                style={{
                    display: arrowPosition.valid && props.sageti === "true" ? "initial" : "none",
                    position: 'absolute',
                    left: `${(badgeDims.width / 2) + arrowPosition.dx - (41 / 2)}px`,
                    top: `${(badgeDims.height / 2) + arrowPosition.dy - (41 / 2)}px`,
                    transform: `rotate(${arrowPosition.bearing - (props.mapBearing || 0)}deg)`,
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