import MapNavbar from "../MapNavbar";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import { useEffect, useRef, useState, useCallback } from "react";
import './Marker/Marker.css';
import Spinner from 'react-bootstrap/Spinner';
import Settings from './Settings';
import React from 'react';
import Undemibusu from "./Undemibusu.js";
import { useParams, useSearchParams } from 'react-router-dom';
import UndemibusuToast from "./UndemibusuToast.js";
import Destinatii from "./Destinatii.js";
import DestinatiiToast from "./DestinatiiToast.js";

mapboxgl.accessToken = 'pk.eyJ1IjoibWlobmVib25kb3IxIiwiYSI6ImNseDd1bDlxcDFyZnAya3M5YnpxOHlrdG4ifQ.ZMlxEn8Tz6jgGhJm16mXkg';

function Map() {
    var map = useRef();

    var defLng = 23.591423;
    var defLat = 46.770439;
    var lastCoords = useRef([defLng, defLat]);
    var lastZoom = useRef(12)
    var markers = useRef([]);
    let vehicles = useRef([]);
    const [uniqueLines, setUniqueLines] = useState([]);
    const [allChecked, setCheckAllChecked] = useState(true);
    let unique = useRef([]);

    const [loaded, setLoaded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    var loadedFirstTime = false;

    var popupOpen = useRef(false);

    const [showUndemibusu, setShowUndemibusu] = useState(false);
    var undemibususearchref = useRef();
    const { undemibusu } = useParams();
    const [showUndemibusuToast, setShowUndemibusuToast] = useState(false);

    const [searchParams] = useSearchParams();

    const [showDestinatii, setShowDestinatii] = useState(false);
    const [showDestinatiiToast, setShowDestinatiiToast] = useState(false);
    let destinatiiSearchRef = useRef();
    let originSearchRef = useRef();
    const [instructions, setInstructions] = useState()


    const addMarker = (vehicle, reload = false) => {
        //popup
        var innerHtmlContent = '<br/><div> Spre: <b>' + vehicle.headsign + '</b></div> <a href="/orar/' + vehicle.line + '">Vezi orar</a>' + '<br/><a href="#" onClick="navigator.clipboard.writeText(`https://busify.ro/map?id=' + vehicle.label + '`); alert(`Link copiat!`);">Copiaza link de urmarire</a>';

        const divElement = document.createElement('div');
        const assignBtn = document.createElement('div');
        const linieFavorita = !(!localStorage.getItem('linii_favorite') || (' ' + localStorage.getItem('linii_favorite') + ' ').search(' ' + vehicle.line + ' ') == -1);
        const switchState = !linieFavorita ? 'flexSwitchCheckDefault">' : 'flexSwitchCheckChecked" checked>';
        assignBtn.className = 'form-check form-switch';
        assignBtn.innerHTML += '<input class="form-check-input" type="checkbox" role="switch" id="' + switchState + 'Linie favorita</input>';
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
            resetMarkers()
        });

        const popup = new mapboxgl.Popup({
            offset: 25
        })
            .setDOMContent(divElement);
        popup.closeOnClick = false;
        popup.on('close', () => {
            removePolyline()
            popupOpen.current = false
        })
        popup.on('open', () => {
            addPolyline(vehicle)
            popupOpen.current = true
        })

        //marker
        if (searchParams.get('id') === vehicle.label) {
            el.className = 'marker-linie-urmarita ';
        }
        else el.className = linieFavorita ? 'marker-linie-favorita ' : 'marker ';
        el.className += unique.current.find(elem => elem[0] === vehicle.line)[1] || searchParams.get('id') === vehicle.label ? 'marker-visible' : 'marker-invisible';
        el.innerHTML = vehicle.line;

        const marker = new mapboxgl.Marker(el)
            .setLngLat(vehicle.lngLat)
            .setPopup(popup)
            .addTo(map.current);

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

                const vehi = vehicles.current.find(elem => elem.label == marker.vehicle.label);
                if (vehi != null) {
                    const end = vehi.lngLat;

                    const lng = start[0] + (end[0] - start[0]) * progress;
                    const lat = start[1] + (end[1] - start[1]) * progress;

                    marker.marker.setLngLat([lng, lat]);
                    marker.vehicle.lngLat = [lng, lat];
                    marker.marker.innerHTML = marker.vehicle.line

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
                    vehicles.current = [];
                    vehicleData.forEach(vehicle => {
                        if (vehicle.trip_id != null && vehicle.route_id != null) {

                            let tripDataVehicle = tripData.find((elem) => elem.trip_id === vehicle.trip_id);
                            let routeDataVehicle = routeData.find((elem) => elem.route_id === vehicle.route_id);

                            if (tripDataVehicle && routeDataVehicle) {
                                let headsign = tripDataVehicle.trip_headsign;
                                let line = routeDataVehicle.route_short_name;
                                if (headsign && line) {
                                    let newVehicle = new Vehicle(vehicle.label, line, headsign, [vehicle.longitude, vehicle.latitude], tripDataVehicle.trip_id);
                                    vehicles.current.push(newVehicle);
                                }
                            }
                        }
                    });

                    if (!loaded && !loadedFirstTime) {
                        let s = [];
                        if (localStorage.getItem('linii_selectate')) s = localStorage.getItem('linii_selectate').split(',');
                        // unique.current = [...new Set(vehicles.current.map(item => item.line))].sort().map(elem => [elem, true])

                        try {
                            const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
                            const buses_basic = await resp.json();
                            const joinArray = (arr) => {
                                arr.forEach(elem => {
                                    unique.current.push([elem.name, true])
                                })
                            }
                            joinArray(buses_basic.urbane)
                            joinArray(buses_basic.metropolitane)
                            joinArray(buses_basic.market)
                        } catch (err) {
                            console.log(err)
                        }

                        let saved = [];
                        for (let i = 0; i < s.length; i += 2)
                            saved.push([s[i], s[i + 1] === 'true']);

                        for (let i = 0; i < saved.length; i++) {
                            let index = getIndex(saved[i][0], unique.current)
                            if (index != -1) {
                                unique.current[index][1] = saved[i][1];
                                if (saved[i][1] === false)
                                    setCheckAllChecked(false)
                            }
                        }
                        setUniqueLines(unique.current)
                        loadedFirstTime = true
                        setLoaded(true)
                        vehicles.current.forEach(elem => {
                            let exista = false
                            unique.current.forEach((uniqueLine) => {
                                if (uniqueLine[0] === elem.line)
                                    exista = true
                            })
                            if (exista)
                                addMarker(elem)
                        })
                        if (undemibusu === 'undemibusu')
                            setShowUndemibusu(true)
                        else if (searchParams.get('id')) {
                            const elem = markers.current.find(elem => elem.vehicle.label === searchParams.get('id'));
                            elem.marker.togglePopup();
                        } else if (undemibusu === 'destinatii')
                            setShowDestinatii(true)
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
        markers.current.forEach(elem => { elem.marker.remove() })
        markers.current = []
        vehicles.current.forEach(elem => {
            let exista = false
            unique.current.forEach((uniqueLine) => {
                if (uniqueLine[0] === elem.line)
                    exista = true
            })
            if (exista)
                addMarker(elem)
        })
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
        map.current.addControl(button, "top-right");
    }

    const generateMap = (refresh = false) => {
        map.current = new mapboxgl.Map({
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
        map.current.addControl(geo);
        map.current.on('load', () => {
            if (refresh)
                map.current.flyTo({
                    center: lastCoords.current,
                    duration: 2000,
                    zoom: lastZoom.current,
                    essential: true
                })
            else if (!popupOpen.current) {
                geo.trigger();
                if (undemibusu === 'destinatii')
                    setTimeout(() => {
                        getUserAddress()
                    }, 1000);
            }
        });
        map.current.on('dragend', (e) => {
            lastCoords.current = map.current.getCenter().toArray();
            lastZoom.current = map.current.getZoom();
        })
    }

    const addPolyline = useCallback(async (vehicle) => {
        if (!map.current.getSource('route')) {
            try {
                var url = 'https://api.tranzy.ai/v1/opendata/shapes?shape_id=' + vehicle.tripId;
                const options = {
                    method: 'GET',
                    headers: {
                        'X-Agency-Id': '2',
                        Accept: 'application/json',
                        'X-API-KEY': 'ksRfq3mejazGhBobQYkPrgAUfnFaClVcgTa0eIlJ'
                    }
                };

                var response = await fetch(url, options);
                const shapeData = await response.json();

                const polylineCoordinates = shapeData.map((elem) => [elem.shape_pt_lon, elem.shape_pt_lat])
                let last = polylineCoordinates.length - 1
                // shapeExtremitiesRef.current = [(vehicle.lngLat[0] + polylineCoordinates[last][0]) / 2, (vehicle.lngLat[1] + polylineCoordinates[last][1]) / 2]
                if (popupOpen.current) {
                    let bounds = new mapboxgl.LngLatBounds();
                    bounds.extend(vehicle.lngLat);
                    bounds.extend(polylineCoordinates[last]);
                    map.current.fitBounds(bounds, {
                        padding: {
                            top: 50,
                            bottom: 50,
                            left: 50,
                            right: 50
                        }, duration: 2000
                    })

                    map.current.addSource('route', {
                        'type': 'geojson',
                        'data': {
                            'type': 'Feature',
                            'properties': {},
                            'geometry': {
                                'type': 'LineString',
                                'coordinates': polylineCoordinates
                            }
                        }
                    });

                    map.current.addLayer({
                        'id': 'route',
                        'type': 'line',
                        'source': 'route',
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': '#888',
                            'line-width': 5
                        }
                    });

                    const size = 125;
                    const pulsingDot = {
                        width: size,
                        height: size,
                        data: new Uint8Array(size * size * 4),

                        // When the layer is added to the map,
                        // get the rendering context for the map canvas.
                        onAdd: function () {
                            const canvas = document.createElement('canvas');
                            canvas.width = this.width;
                            canvas.height = this.height;
                            this.context = canvas.getContext('2d');
                        },

                        // Call once before every frame where the icon will be used.
                        render: function () {
                            const duration = 1000;
                            const t = (performance.now() % duration) / duration;

                            const radius = (size / 2) * 0.3;
                            const outerRadius = (size / 2) * 0.7 * t + radius;
                            const context = this.context;

                            // Draw the outer circle.
                            context.clearRect(0, 0, this.width, this.height);
                            context.beginPath();
                            context.arc(
                                this.width / 2,
                                this.height / 2,
                                outerRadius,
                                0,
                                Math.PI * 2
                            );
                            context.fillStyle = `rgba(128, 0, 128, ${1 - t})`;
                            context.fill();

                            // Draw the inner circle.
                            context.beginPath();
                            context.arc(
                                this.width / 2,
                                this.height / 2,
                                radius,
                                0,
                                Math.PI * 2
                            );
                            context.fillStyle = 'rgba(128, 0, 128)'; // 
                            context.strokeStyle = 'white';
                            context.lineWidth = 2 + 4 * (1 - t);
                            context.fill();
                            context.stroke();

                            // Update this image's data with data from the canvas.
                            this.data = context.getImageData(
                                0,
                                0,
                                this.width,
                                this.height
                            ).data;

                            // Continuously repaint the map, resulting
                            // in the smooth animation of the dot.
                            map.current.triggerRepaint();

                            // Return `true` to let the map know that the image was updated.
                            return true;
                        }
                    };

                    map.current.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });

                    map.current.addSource('dot-point', {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': [
                                {
                                    'type': 'Feature',
                                    'geometry': {
                                        'type': 'Point',
                                        'coordinates': polylineCoordinates[last]
                                    }
                                }
                            ]
                        }
                    });

                    map.current.addLayer({
                        'id': 'layer-with-pulsing-dot',
                        'type': 'symbol',
                        'source': 'dot-point',
                        'layout': {
                            'icon-image': 'pulsing-dot'
                        }
                    });
                }
            } catch { }
        }
    }, []);

    const removePolyline = useCallback(() => {
        let hasSomething = false;
        if (map.current.getLayer('route')) {
            map.current.removeLayer('route');
            hasSomething = true
        }
        if (map.current.getSource('route')) {
            map.current.removeSource('route');
            hasSomething = true
        }
        if (map.current.getLayer('layer-with-pulsing-dot')) {
            map.current.removeLayer('layer-with-pulsing-dot');
            hasSomething = true
        }
        if (map.current.getSource('dot-point')) {
            map.current.removeSource('dot-point');
            hasSomething = true
        }
        if (hasSomething && lastCoords.current[0] !== defLng && lastCoords.current[1] !== defLat) {
            map.current.flyTo({
                center: lastCoords.current,
                duration: 2000,
                zoom: lastZoom.current,
                essential: true
            })
        }
    }, []);

    const setShownVehicles = () => {
        let s = [];
        if (localStorage.getItem('linii_selectate')) s = localStorage.getItem('linii_selectate').split(',');
        let saved = [];
        for (let i = 0; i < s.length; i += 2)
            saved.push([s[i], s[i + 1] === 'true']);

        for (let i = 0; i < saved.length; i++) {
            let index = getIndex(saved[i][0], unique.current)
            if (index != -1) {
                unique.current[index][1] = saved[i][1];
                if (saved[i][1] === false) {
                    setCheckAllChecked(false)
                    console.log(saved[i])
                }
            }
        }
    }

    const getUserAddress = async () => {
        try {
            const lngLat = map.current._controls[2]._lastKnownPosition.coords.latitude + ',' + map.current._controls[2]._lastKnownPosition.coords.longitude;
            const key = 'AIzaSyAW0rKcBmVtEZ12-9oUmjSHDyvdy-6fr3w'
            const url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lngLat + '&sensor=true&key=' + key;
            const data = await fetch(url);
            const resp = await data.json();
            originSearchRef.current.value = resp.results[0].formatted_address
        } catch (e) {
            console.log(e)
        }
    }

    const getRoutes = async () => {
        const apiKey = 'AIzaSyAW0rKcBmVtEZ12-9oUmjSHDyvdy-6fr3w';
        const origin = originSearchRef.current.value; // Replace with actual place_id or address
        const destination = 'Cluj Napoca ' + destinatiiSearchRef.current.value // Replace with actual place_id or address
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}&mode=transit&language=RO`;

        try {
            const response = await fetch('https://cors-anywhere.herokuapp.com/' + url);
            const data = await response.json();
            if (data.status === 'OK') {
                console.log(data)
                setInstructions(data.routes[0].legs[0])
                setShowDestinatiiToast(true)
            } else {
                console.error('Error fetching directions:', data.error_message);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    useEffect(() => {
        if (map.current) return;
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
                    unique.current = uniqueLines
                    resetMarkers()
                    localStorage.setItem('linii_selectate', uniqueLines)
                }}
                vehicles={uniqueLines}
                setVehicles={setUniqueLines}
                selectAllCheck={allChecked}
                setChecked={setCheckAllChecked}
            />
            <Undemibusu
                show={showUndemibusu}
                undemibususearchref={undemibususearchref}
                onHide={() => {
                    setShowUndemibusu(false)

                    let oneMatch = false;
                    unique.current = unique.current.map((elem) => [elem[0], elem[0] === undemibususearchref.current.value])
                    unique.current.forEach(elem => {
                        if (elem[1]) oneMatch = true
                    });
                    if (!oneMatch)
                        setShownVehicles();
                    else setShowUndemibusuToast(true);

                    setUniqueLines(unique.current)
                    setCheckAllChecked(!oneMatch)
                    resetMarkers();
                }} />
            <UndemibusuToast
                show={showUndemibusuToast}
                onHide={() => {
                    setShownVehicles();
                    setShowUndemibusuToast(false)
                    setUniqueLines(unique.current)
                    setCheckAllChecked(true)
                    resetMarkers();
                }} />
            <Destinatii
                show={showDestinatii}
                destination={destinatiiSearchRef}
                origin={originSearchRef}
                onHide={() => {
                    setShowDestinatii(false)
                    getRoutes();
                }} />
            <DestinatiiToast
                show={showDestinatiiToast}
                instructions={instructions}
                map={map}
                setuniquelines={setUniqueLines}
                unique={unique}
                resetmarkers={resetMarkers}
                setshownvehicles={setShownVehicles}
            />
        </div >
    );
}

export default Map;

class Vehicle {
    constructor(label, line, headsign, lngLat, tripId) {
        this.label = label;
        this.line = line;
        this.headsign = headsign;
        this.lngLat = lngLat;
        this.tripId = tripId
    }
}