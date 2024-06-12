import MapNavbar from "./MapNavbar";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useEffect, useRef, useState } from "react";
import './Marker/Marker.css';
import Spinner from 'react-bootstrap/Spinner';

mapboxgl.accessToken = 'pk.eyJ1IjoibWlobmVib25kb3IxIiwiYSI6ImNseDd1bDlxcDFyZnAya3M5YnpxOHlrdG4ifQ.ZMlxEn8Tz6jgGhJm16mXkg';

function Map() {
    var map = null;

    var defLng = 23.591423;
    var defLat = 46.770439;

    var endLng = defLng + 0.01;
    var endLat = defLat;

    var markers = useRef([]);
    let vehicles = new Array();

    const [loaded, setLoaded] = useState(false);
    var loadedFirstTime = false;

    const addMarker = (vehicle) => {
        //popup
        var innerHtmlContent = '<br/><div> Spre: <b>' + vehicle.headsign + '</b></div>';

        const divElement = document.createElement('div');
        const assignBtn = document.createElement('div');
        const linieFavorita = !(!localStorage.getItem('linii_favorite') || localStorage.getItem('linii_favorite').search(vehicle.line) == -1);
        const switchState = !linieFavorita ? 'flexSwitchCheckDefault">' : 'flexSwitchCheckChecked" checked>';
        assignBtn.className = 'form-check form-switch';
        assignBtn.innerHTML += '<input class="form-check-input" type="checkbox" role="switch" id="' + switchState;
        assignBtn.innerHTML += 'Linie favorita';
        divElement.innerHTML = innerHtmlContent + '<br/>';
        divElement.appendChild(assignBtn);

        assignBtn.addEventListener('click', (e) => {
            var linii = localStorage.getItem('linii_favorite');
            if (!linii)
                linii = '';

            if (linii.search(vehicle.line) != -1) {
                linii = linii.replace(vehicle.line + ' ', '')
            } else linii += vehicle.line + ' ';

            localStorage.setItem('linii_favorite', linii)

            if (!localStorage.getItem('linii_favorite_tutorial')) {
                alert('Schimbarile vor lua efect la urmatorul refresh :)')
                localStorage.setItem('linii_favorite_tutorial', true)
            }
        });

        const popup = new mapboxgl.Popup({
            offset: 25
        })
            .setDOMContent(divElement);

        //marker
        var el = document.createElement('div');
        el.className = linieFavorita ? 'marker-linie-favorita' : 'marker';
        el.innerHTML = vehicle.line;

        const marker = new mapboxgl.Marker(el)
            .setLngLat(vehicle.lngLat)
            .setPopup(popup)
            .addTo(map);

        markers.current.push({ marker, vehicle });
    };

    const updateMarker = () => {
        markers.current.forEach(marker => {
            let progress = 0;
            const step = 0.02;
            const animateMarker = () => {
                progress += step;
                if (progress > 1) progress = 1;

                const start = marker.vehicle.lngLat;

                const vehi = vehicles.find(elem => elem.label == marker.vehicle.label);
                if (vehi != null) {
                    const end = vehi.lngLat;

                    const lng = start[0] + (end[0] - start[0]) * progress;
                    const lat = start[1] + (end[1] - start[1]) * progress;

                    marker.marker.setLngLat([lng, lat]);
                    marker.vehicle.lngLat = [lng, lat];

                    if (progress < 1) {
                        requestAnimationFrame(animateMarker);
                    }
                }
            };

            requestAnimationFrame(animateMarker);
        });
    };

    const fetchData = async () => {

        var url = 'https://api.tranzy.ai/v1/opendata/vehicles';
        const options = {
            method: 'GET',
            headers: {
                'X-Agency-Id': '2',
                Accept: 'application/json',
                'X-API-KEY': 'ksRfq3mejazGhBobQYkPrgAUfnFaClVcgTa0eIlJ'
            }
        };

        try {
            var response = await fetch(url, options);
            const vehicleData = await response.json();

            url = 'https://api.tranzy.ai/v1/opendata/trips';

            try {
                response = await fetch(url, options);
                const tripData = await response.json();

                url = 'https://api.tranzy.ai/v1/opendata/routes';

                try {
                    response = await fetch(url, options);
                    const routeData = await response.json();
                    vehicles = [];
                    vehicleData.forEach(vehicle => {
                        if (vehicle.trip_id != null && vehicle.route_id != null) {

                            let tripDataVehicle = tripData.find((elem) => elem.trip_id === vehicle.trip_id);
                            let routeDataVehicle = routeData.find((elem) => elem.route_id === vehicle.route_id);

                            if (tripDataVehicle && routeDataVehicle) {
                                let headsign = tripDataVehicle.trip_headsign;
                                let line = routeDataVehicle.route_short_name;
                                if (headsign && line) {
                                    let newVehicle = new Vehicle(vehicle.label, line, headsign, [vehicle.longitude, vehicle.latitude]);
                                    vehicles.push(newVehicle);
                                }
                            }
                        }
                    });

                    if (!loaded && !loadedFirstTime) {
                        loadedFirstTime = true
                        setLoaded(true)
                        vehicles.forEach(elem => {
                            addMarker(elem)
                        })
                    } else {
                        console.log("aici")
                        updateMarker()
                    }
                } catch (error) {
                    console.error(error);
                }

            } catch (error) {
                console.error(error);
                return;
            }

        } catch (error) {
            console.error(error);
            return;
        }
    }

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

        fetchData();

        setInterval(() => {
            fetchData()
        }, 5000);
    }, []);

    return (
        <div className='body'>
            <MapNavbar />
            <div id='map' className="map-container" style={{ visibility: loaded ? 'visible' : 'hidden' }} />
            <Spinner animation="grow" variant='dark' className='spinner-container' style={{ visibility: !loaded ? 'visible' : 'hidden' }} />
        </div >
    );
}

export default Map;

class Vehicle {
    constructor(label, line, headsign, lngLat) {
        this.label = label;
        this.line = line;
        this.headsign = headsign;
        this.lngLat = lngLat;
    }
}