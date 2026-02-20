import React, {useEffect, useRef} from "react";
import mapboxgl from "mapbox-gl";
import "./Map.css";

function Teste() {
    const map = useRef(null);
    const mapContainer = useRef(null);
    const markersRef = useRef([]);

    const filterConglomerates = (vehicles, threshold = 3) => {
        const locationCount = {};

        vehicles.forEach(v => {
            if (!v.latitude || !v.longitude) return;

            const key = `${v.latitude.toFixed(5)}-${v.longitude.toFixed(5)}`;
            locationCount[key] = (locationCount[key] || 0) + 1;
        });

        return vehicles.filter(v => {
            const key = `${v.latitude.toFixed(5)}-${v.longitude.toFixed(5)}`;
            return locationCount[key] <= threshold;
        });
    };

    const fetchVehicles = async () => {
        try {
            const data = await fetch(
                "https://busifyserver.onrender.com/vehicles"
            ).then(r => r.json());

            const vehicles = data
                .filter(v => (!v.trip_id) !== (!v.route_id))
                .filter(v => v.latitude && v.longitude);

            const filtered = filterConglomerates(vehicles, 3);
            console.log(filtered);

            addMarkers(filtered);
        } catch (err) {
            console.error(err);
        }
    };

    const addMarkers = (vehicles) => {
        if (!map.current) return;

        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        vehicles.forEach(vehicle => {
            if (!vehicle.longitude || !vehicle.latitude) return;

            const el = document.createElement("div");
            el.className = "vehicle-marker-teste";
            el.innerText = vehicle.label || "Vehicle";

            const marker = new mapboxgl.Marker(el)
                .setLngLat([vehicle.longitude, vehicle.latitude])
                .addTo(map.current);

            markersRef.current.push(marker);
        });
    };

    const makeMap = async () => {
        try{
            const keyJson = await fetch("https://busifyserver.onrender.com/mapbox").then(r => r.json());
            console.log(keyJson);
            mapboxgl.accessToken = keyJson.accessToken;

            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                center: [23.6236, 46.7712],
                style: "mapbox://styles/mihnebondor1/cm989e83e00g801pg1e2udadb",
                zoom: 13,
                attributionControl: false
            });

            map.current.on("load", () => {
                fetchVehicles();
                setInterval(() =>{
                    fetchVehicles();
                }, 20000);
            });
        } catch {}
    }
    useEffect(() => {
        if (map.current) return;
        makeMap();

    }, []);

    return <div ref={mapContainer} className="map-container" />;
}

export default Teste;