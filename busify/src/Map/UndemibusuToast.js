import React, {useEffect, useState} from 'react';
import Marker from "../OtherComponents/Marker";
import CloseButton from "react-bootstrap/CloseButton";
import {BottomSheet} from "react-spring-bottom-sheet";

function UndemibusuToast(props) {
    const [uniqueMarkers, setUniqueMarkers] = useState([]);

    // Calculate distance between two points (Haversine formula)
    function calculateDistance(lat1, lon1, lat2, lon2) {
        function toRadians(degrees) {
            return degrees * (Math.PI / 180);
        }

        const R = 6371; // Earth's radius in km
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in kilometers
    }

    // Calculate ETA in minutes (assuming 20 km/h average speed)
    function calculateETA(vehicle, stop) {
        const dist = calculateDistance(
            vehicle.lngLat[1], vehicle.lngLat[0],
            stop.stop_lat, stop.stop_lon
        );
        return Math.floor(Math.abs(dist) / 20 * 60);
    }

    // Check if a vehicle has already passed a stop
    function hasVehiclePassedStop(vehicle, targetStop) {
        if (!props.allStopTimesRef?.current || !props.allStopsRef?.current) return false;

        // Get all stop times for this vehicle's trip (in order)
        const tripStopTimes = props.allStopTimesRef.current.filter(st => st.trip_id === vehicle.tripId);
        if (tripStopTimes.length === 0) return false;

        // Find the index of the target stop in the trip
        const targetStopIndex = tripStopTimes.findIndex(st => st.stop_id == targetStop.stop_id);
        if (targetStopIndex === -1) return true; // Stop not on this trip

        // Get the target stop coordinates
        const targetStopData = props.allStopsRef.current.find(s => s.stop_id === targetStop.stop_id);
        if (!targetStopData) return false;

        // Calculate distance from vehicle to target stop
        const distToTarget = calculateDistance(
            vehicle.lngLat[1], vehicle.lngLat[0],
            targetStopData.stop_lat, targetStopData.stop_lon
        );

        // If vehicle is very close to target stop (within 50m), it hasn't passed yet
        if (distToTarget < 0.05) return false;

        // Find the nearest stop to the vehicle's current position
        let nearestStopIndex = 0;
        let minDistance = Infinity;

        tripStopTimes.forEach((st, index) => {
            const stop = props.allStopsRef.current.find(s => s.stop_id === st.stop_id);
            if (stop) {
                const dist = calculateDistance(vehicle.lngLat[1], vehicle.lngLat[0], stop.stop_lat, stop.stop_lon);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestStopIndex = index;
                }
            }
        });

        // If vehicle is between two stops, check if it's heading away from target
        // Vehicle has passed if:
        // 1. Its nearest stop is after the target stop, OR
        // 2. Its nearest stop IS the target stop but it's closer to the NEXT stop (moving away)
        if (nearestStopIndex > targetStopIndex) {
            return true;
        }

        // If nearest stop is the target stop, check if vehicle is moving past it
        if (nearestStopIndex === targetStopIndex && targetStopIndex < tripStopTimes.length - 1) {
            // Get the next stop after target
            const nextStopTime = tripStopTimes[targetStopIndex + 1];
            const nextStop = props.allStopsRef.current.find(s => s.stop_id === nextStopTime.stop_id);

            if (nextStop) {
                const distToNext = calculateDistance(
                    vehicle.lngLat[1], vehicle.lngLat[0],
                    nextStop.stop_lat, nextStop.stop_lon
                );

                // If vehicle is closer to the next stop than to the target, it has passed
                if (distToNext < distToTarget) {
                    return true;
                }
            }
        }

        return false;
    }

    // State to store arriving vehicles with ETA
    const [arrivingVehicles, setArrivingVehicles] = useState(null);

    // Update arriving vehicles when markers update or filtering changes
    useEffect(() => {
        if (!props.filteringStop || !props.allStopTimesRef?.current || !props.vehiclesRef?.current) {
            setArrivingVehicles(null);
            return;
        }

        // Get trip_ids that pass through this stop
        // This inherently handles direction since each trip has a specific direction
        const tripIdsAtStop = new Set(
            props.allStopTimesRef.current
                .filter(st => st.stop_id == props.filteringStop.stop_id)
                .map(st => st.trip_id)
        );

        // Use vehiclesRef.current which always has all vehicles
        const allVehicles = props.vehiclesRef.current;

        // Filter vehicles by tripId (direction-aware) and exclude those that have already passed
        const vehiclesWithETA = allVehicles
            .filter(v => tripIdsAtStop.has(v.tripId) && !hasVehiclePassedStop(v, props.filteringStop))
            .map(v => ({
                vehicle: v,
                eta: calculateETA(v, props.filteringStop)
            }))
            .sort((a, b) => a.eta - b.eta);

        setArrivingVehicles(vehiclesWithETA);
    }, [props.filteringStop, props.vehicleUpdateCounter]);

    useEffect(() => {
        // Skip if we're in stop filtering mode
        if (props.filteringStop) {
            return;
        }

        setTimeout(() => {
            const visibleMarkers = props.markersState.filter(elem =>
                (props.unique.current.find(el => el[0] === elem.vehicle.line)?.[1] === true &&
                    !props.foundLabelsRef.current.length) ||
                props.foundLabelsRef.current.includes(elem.vehicle.label)
            );

            console.log(props.foundLabelsRef.current);
            console.log(visibleMarkers)

            const seen = new Set();
            const uniqueMarkersTemp = visibleMarkers.filter(item => {
                if (seen.has(item.vehicle.line)) return false;
                seen.add(item.vehicle.line);
                return true;
            });

            setUniqueMarkers(uniqueMarkersTemp);
        }, 1000);
    }, [props.filteringStop]);

    // Format ETA display
    const formatETA = (minutes) => {
        if (minutes < 1) return '0 min';
        if (minutes === 1) return '1 min';
        return `${minutes} min`;
    };

    // Get color based on ETA
    const getETAColor = (minutes) => {
        if (minutes <= 5) return '#0FBE7E'; // Green
        if (minutes <= 10) return '#E7CD35'; // Yellow
        return '#FF0C0B'; // Red
    };

    // Render arrival list when filtering by stop
    const renderArrivalList = () => {
        if (!arrivingVehicles || arrivingVehicles.length === 0) {
            return (
                <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    Niciun vehicul în apropiere.
                    <CloseButton style={{marginLeft: 'auto'}}
                                 onClick={() => {
                                     setUniqueMarkers([])
                                     props.onHide()
                                 }}/>
                </div>
            );
        }

        return (
            <>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '10px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #eee'
                }}>
                    <div>
                        <b>Stația {props.filteringStop.stop_name}</b>
                    </div>
                    <CloseButton style={{marginLeft: 'auto'}}
                                 onClick={() => {
                                     setUniqueMarkers([])
                                     props.onHide()
                                 }}/>
                </div>
                {arrivingVehicles.map((el, i) => (
                    <div
                        key={el.vehicle.label}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: '8px',
                            padding: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: '#f8f9fa'
                        }}
                        onClick={() => {
                            if (props.onSelectVehicle) {
                                props.onSelectVehicle(el);
                            }
                        }}
                    >
                        <Marker
                            type={el.vehicle.vehicleType}
                            name={el.vehicle.line}
                        />
                        <div style={{
                            textAlign: 'left',
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginRight: '10px'
                        }}>
                            {el.vehicle.route}
                        </div>
                        <div style={{
                            color: getETAColor(el.eta),
                            fontWeight: '600',
                            fontSize: '16px',
                            minWidth: '60px',
                            textAlign: 'right'
                        }}>
                            {formatETA(el.eta)}
                        </div>
                    </div>
                ))}
            </>
        );
    };

    // Render default list (when not filtering by stop)
    const renderDefaultList = () => {
        if (uniqueMarkers?.length > 0) {
            return uniqueMarkers.map((el, i) => (
                <div key={el.vehicle.label} style={{display: "flex", flexDirection: "row", alignItems: "center", marginBottom: '5px'}}>
                    <Marker
                        type={el.vehicle.vehicleType}
                        name={el.vehicle.line}
                        minContent={true}
                    />
                    {/*<div style={{textAlign: 'left'}}><b>{el.vehicle.route}</b></div>*/}
                    <CloseButton style={{marginLeft: 'auto', display: i === 0 ? "initial" : "none"}}
                                 onClick={() => {
                                     setUniqueMarkers([])
                                     props.onHide()
                                 }}/>
                </div>
            ));
        }

        return (
            <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                Apasă pe X pentru a reveni.
                <CloseButton style={{marginLeft: 'auto'}}
                             onClick={() => {
                                 setUniqueMarkers([])
                                 props.onHide()
                             }}/>
            </div>
        );
    };

    // Determine if we should use expandable snap points (for arrival list)
    const useExpandableSheet = props.filteringStop && arrivingVehicles && arrivingVehicles.length > 0;

    return (
        <BottomSheet
            open={props.show}
            expandOnContentDrag={useExpandableSheet}
            scrollLocking={false}
            blocking={false}
            snapPoints={useExpandableSheet
                ? ({maxHeight}) => [maxHeight * 0.25, maxHeight * 0.85]
                : ({minHeight}) => [minHeight]
            }
            defaultSnap={useExpandableSheet
                ? ({maxHeight}) => maxHeight * 0.25
                : ({minHeight}) => minHeight
            }
        >
            <div style={{margin: '10px 20px'}}>
                {props.filteringStop ? renderArrivalList() : renderDefaultList()}
            </div>
        </BottomSheet>
    )
}

export default UndemibusuToast
