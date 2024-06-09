import MapNavbar from "./MapNavbar";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useEffect } from "react";

mapboxgl.accessToken = 'pk.eyJ1IjoibWlobmVib25kb3IxIiwiYSI6ImNseDd1bDlxcDFyZnAya3M5YnpxOHlrdG4ifQ.ZMlxEn8Tz6jgGhJm16mXkg';

function Map() {
    var map = null;
    var defLng = 23.591423;
    var defLat = 46.770439;

    useEffect(() => {
        if (map) return;

        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [defLng, defLat],
            zoom: 12,
            attributionControl: false
        });

        const geo = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            // When active the map will receive updates to the device's location as it changes.
            trackUserLocation: true,
            // Draw an arrow next to the location dot to indicate which direction the device is heading.
            showUserHeading: true,
            showAccuracyCircle: true
        })

        map.addControl(geo);
        map.on('load', () => {
            geo.trigger();
        });

    }, []);

    return (
        <div className='body'>
            <MapNavbar />
            <div id='map' className="map-container" />
        </div>
    );
}

export default Map;