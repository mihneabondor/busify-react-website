import MapNavbar from "./MapNavbar";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useEffect, useRef } from "react";
import './Marker/Marker.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibWlobmVib25kb3IxIiwiYSI6ImNseDd1bDlxcDFyZnAya3M5YnpxOHlrdG4ifQ.ZMlxEn8Tz6jgGhJm16mXkg';

function Map() {
    var map = null;

    var defLng = 23.591423;
    var defLat = 46.770439;

    var endLng = defLng + 0.01;
    var endLat = defLat;

    var markers = useRef([]);

    const addMarker = (lngLat, linie) => {
        var el = document.createElement('div');
        el.className = 'marker';
        el.innerHTML = linie;

        const marker = new mapboxgl.Marker(el)
            .setLngLat(lngLat)
            .addTo(map);

        markers.current.push({ marker, lngLat });
    };

    const iterateMarkers = () => {
        markers.current.forEach(marker => {
            const lngLat = marker.lngLat;
            let progress = 0;
            const step = 0.02;

            const animateMarker = () => {
                progress += step;
                if (progress > 1) progress = 1;

                const start = lngLat;
                const end = [start[0] + 0.02, start[1]];

                const lng = start[0] + (end[0] - start[0]) * progress;
                const lat = start[1] + (end[1] - start[1]) * progress;

                marker.marker.setLngLat([lng, lat]);
                marker.lngLat = [lng, lat];

                if (progress < 1) {
                    requestAnimationFrame(animateMarker);
                }
            };

            requestAnimationFrame(animateMarker);
        });
    };

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
            trackUserLocation: true,
            showUserHeading: true,
            showAccuracyCircle: true
        })

        map.addControl(geo);
        map.on('load', () => {
            geo.trigger();
        });

        addMarker([defLng, defLat], '42')

        setTimeout(() => {
            iterateMarkers();
        }, 3000)

    }, []);

    return (
        <div className='body'>
            <MapNavbar />
            <div id='map' className="map-container" />
        </div>
    );
}

export default Map;