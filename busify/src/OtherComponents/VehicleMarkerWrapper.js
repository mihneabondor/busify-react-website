// VehicleMarkerWrapper.jsx
import React, { useImperativeHandle, forwardRef, useState } from 'react';
import Marker from './Marker';

const VehicleMarkerWrapper = forwardRef(({ initialVehicle, mapBearing }, ref) => {
    const [vehicle, setVehicle] = useState(initialVehicle);

    useImperativeHandle(ref, () => ({
        updateVehicle: (updatedData) => {
            setVehicle(updatedData);
        }
    }));

    // Check if coords are valid
    const hasValidCurrentCoords = vehicle.currentCoords &&
        vehicle.currentCoords[0] !== undefined &&
        vehicle.currentCoords[1] !== undefined;
    const hasValidNextCoords = vehicle.nextCoords &&
        vehicle.nextCoords[0] !== undefined &&
        vehicle.nextCoords[1] !== undefined;

    return (
        <Marker
            type={vehicle.vehicleType}
            name={vehicle.line}
            minContent={true}
            hidden={vehicle.hidden}
            iconite={localStorage.getItem("iconite")}
            sageti={localStorage.getItem("sageti")}
            outline={true}
            vehiclePos={hasValidCurrentCoords ? {
                lat: vehicle.currentCoords[1],
                lng: vehicle.currentCoords[0]
            } : null}
            nextPos={hasValidNextCoords ? {
                lat: vehicle.nextCoords[1],
                lng: vehicle.nextCoords[0]
            } : null}
            mapBearing={mapBearing}
            label={vehicle.label}
        />
    );
});

export default VehicleMarkerWrapper;
