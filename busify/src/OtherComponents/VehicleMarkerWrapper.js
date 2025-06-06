// VehicleMarkerWrapper.jsx
import React, { useImperativeHandle, forwardRef, useState } from 'react';
import Marker from './Marker';

const VehicleMarkerWrapper = forwardRef(({ initialVehicle }, ref) => {
    const [vehicle, setVehicle] = useState(initialVehicle);

    useImperativeHandle(ref, () => ({
        updateVehicle: (updatedData) => {
            setVehicle(updatedData);
        }
    }));

    return (
        <Marker
            type={vehicle.vehicleType}
            name={vehicle.line}
            minContent={true}
            hidden={vehicle.hidden}
            iconite={localStorage.getItem("iconite")}
            sageti={localStorage.getItem("sageti")}
            outline={true}
            vehiclePos={{
                lat: vehicle.currentCoords[1],
                lng: vehicle.currentCoords[0]
            }}
            nextPos={{
                lat: vehicle.nextCoords[1],
                lng: vehicle.nextCoords[0]
            }}
        />
    );
});

export default VehicleMarkerWrapper;
