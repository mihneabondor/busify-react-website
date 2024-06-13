import MapNavbar from "./MapNavbar";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useEffect, useRef, useState, useReducer } from "react";
import './Marker/Marker.css';
import Spinner from 'react-bootstrap/Spinner';
import Settings from './Settings';
import React from 'react';

mapboxgl.accessToken = 'pk.eyJ1IjoibWlobmVib25kb3IxIiwiYSI6ImNseDd1bDlxcDFyZnAya3M5YnpxOHlrdG4ifQ.ZMlxEn8Tz6jgGhJm16mXkg';

function Map() {
    var map = null;

    var defLng = 23.591423;
    var defLat = 46.770439;
    var [lastCoords, setLastCoords] = useState([]);
    var [lastZoom, setLastZoom] = useState([]);
    var markers = useRef([]);
    let vehicles = new Array();
    const [uniqueLines, setUniqueLines] = useState([]);
    const [allChecked, setCheckAllChecked] = useState(true);
    let unique = [];

    const [loaded, setLoaded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    var loadedFirstTime = false;

    const addMarker = (vehicle, reload = false) => {
        //popup
        var innerHtmlContent = '<br/><div> Spre: <b>' + vehicle.headsign + '</b></div>';

        const divElement = document.createElement('div');
        const assignBtn = document.createElement('div');
        const linieFavorita = !(!localStorage.getItem('linii_favorite') || (' ' + localStorage.getItem('linii_favorite') + ' ').search(' ' + vehicle.line + ' ') == -1);
        const switchState = !linieFavorita ? 'flexSwitchCheckDefault">' : 'flexSwitchCheckChecked" checked>';
        assignBtn.className = 'form-check form-switch';
        assignBtn.innerHTML += '<input class="form-check-input" type="checkbox" role="switch" id="' + switchState;
        assignBtn.innerHTML += 'Linie favorita';
        divElement.innerHTML = innerHtmlContent;
        divElement.appendChild(assignBtn);

        var el = document.createElement('div');
        assignBtn.addEventListener('click', (e) => {
            var linii = localStorage.getItem('linii_favorite');
            if (!linii)
                linii = '';

            if (linii.search(vehicle.line) != -1) {
                linii = linii.replace(vehicle.line + ' ', '')
            } else {
                linii += vehicle.line + ' ';
            }

            localStorage.setItem('linii_favorite', linii)
            if (!localStorage.getItem('linii_favorite_tutorial')) {
                alert('Schimbarile vor avea efect la urmatorul refresh :)')
                localStorage.setItem('linii_favorite_tutorial', true)
            }
        });

        const popup = new mapboxgl.Popup({
            offset: 25
        })
            .setDOMContent(divElement);

        //marker
        el.className = linieFavorita ? 'marker-linie-favorita ' : 'marker ';
        if (reload)
            el.className += uniqueLines.find(elem => elem[0] === vehicle.line)[1] ? 'marker-visible' : 'marker-invisible';
        else el.className += unique.find(elem => elem[0] === vehicle.line)[1] ? 'marker-visible' : 'marker-invisible';
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

    function getIndex(target, arr) {
        for (let i = 0; i < arr.length; i++)
            if (arr[i][0] === target)
                return i
        return -1;
    }

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
                        let s = [];
                        if (localStorage.getItem('linii_selectate')) s = localStorage.getItem('linii_selectate').split(',');
                        unique = [...new Set(vehicles.map(item => item.line))].sort().map(elem => [elem, true])
                        let saved = [];
                        for (let i = 0; i < s.length; i += 2)
                            saved.push([s[i], s[i + 1] === 'true']);

                        for (let i = 0; i < saved.length; i++) {
                            let index = getIndex(saved[i][0], unique)
                            if (index != -1) {
                                unique[index][1] = saved[i][1];
                                if (saved[i][1] === false)
                                    setCheckAllChecked(false)
                            }
                        }
                        setUniqueLines(unique)

                        loadedFirstTime = true
                        setLoaded(true)
                        vehicles.forEach(elem => { addMarker(elem) })
                    } else {
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

    const resetMarkers = () => {
        vehicles = markers.current.map(elem => elem.vehicle)
        markers.current.forEach(elem => { elem.marker.remove() })
        markers.current = []
        generateMap(true)
        vehicles.forEach(elem => addMarker(elem, true))
    }

    function addSettingsButton() {
        class settingsButton {
            onAdd(map) {
                const div = document.createElement("div");
                div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
                div.innerHTML = `<button><svg width = '17' height = '17' fill ='#34B5E5' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg></button>`;
                div.addEventListener("contextmenu", (e) => e.preventDefault());
                div.addEventListener("click", () => setShowSettings((prev) => !prev));

                return div;
            }
        }
        const button = new settingsButton();
        map.addControl(button, "top-right");
    }

    const generateMap = (refresh = false) => {
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
        addSettingsButton();
        map.addControl(geo);
        map.on('load', () => {
            console.log(lastCoords)
            if (refresh)
                map.flyTo({
                    center: lastCoords,
                    duration: 2000,
                    zoom: lastZoom,
                    essential: true
                })
            else geo.trigger();
        });
        map.on('dragend', (e) => {
            setLastCoords(map.getCenter().toArray())
            setLastZoom(map.getZoom());
        })
    }

    useEffect(() => {
        if (map) return;
        generateMap()
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
            <Settings
                show={showSettings}
                onHide={() => {
                    setShowSettings(false)
                    resetMarkers()
                    localStorage.setItem('linii_selectate', uniqueLines)
                }}
                vehicles={uniqueLines}
                setVehicles={setUniqueLines}
                selectAllCheck={allChecked}
                setChecked={setCheckAllChecked}
            />
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