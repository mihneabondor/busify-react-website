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
import '../Orare/Traseu.css'
import {io} from 'socket.io-client'
import Search from "./Search.js";
import VehicleToast from "./Marker/VehicleToast.js";
import NotificationToast from "./NotificationToast.js";
import MessageSMS from "./MessageSMS.js";
import StopToast from "./Marker/StopToast.js";

mapboxgl.accessToken = 'pk.eyJ1IjoibWlobmVib25kb3IxIiwiYSI6ImNseDd1bDlxcDFyZnAya3M5YnpxOHlrdG4ifQ.ZMlxEn8Tz6jgGhJm16mXkg';

function Map() {
    var map = useRef();
    var defLng = 23.591423;
    var defLat = 46.770439;
    var lastCoords = useRef([defLng, defLat]);
    var lastZoom = useRef(12)
    var markers = useRef([]);
    var stopMarkers = useRef([]);
    let vehicles = useRef([]);
    const [uniqueLines, setUniqueLines] = useState([]);
    const [allChecked, setCheckAllChecked] = useState(true);
    let unique = useRef([]);

    const [loaded, setLoaded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    var loadedFirstTime = false;
    const [showSearch, setShowSearch] = useState(false);

    var popupOpen = useRef(false);
    const popupIndex = useRef(0);

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

    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const selectedVehicleRef = useRef(null)
    const [showNotification, setShowNotification] = useState(false)

    const [showSms, setShowSms] = useState(false)
    const smsDataRef = useRef(null)

    const [showStop, setShowStop] = useState(false)

    const socket = useRef();

    const addStopMarker = (stop) => {
        var el = document.createElement('div');

        //marker
        el.className = 'traseu-marker';
        el.innerHTML = '<svg fill="#ffffff" height="15px" width="15px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g transform="translate(0 -1)"> <g> <g> <polygon points="328.533,86.333 328.533,137.533 354.133,137.533 354.133,94.867 354.133,86.333 "></polygon> <polygon points="285.867,94.867 285.867,137.533 311.467,137.533 311.467,86.333 285.867,86.333 "></polygon> </g> </g> </g> <g> <g> <path d="M405.333,25.6H234.667c-5.12,0-8.533,3.413-8.533,8.533v51.2H192V25.6C192,11.093,180.907,0,166.4,0 c-14.507,0-25.6,11.093-25.6,25.6v435.2c-23.893,0-42.667,18.773-42.667,42.667c0,5.12,3.413,8.533,8.533,8.533h119.467 c5.12,0,8.533-3.413,8.533-8.533c0-23.893-18.773-42.667-42.667-42.667V256h34.133v51.2c0,5.12,3.413,8.533,8.533,8.533h170.667 c5.12,0,8.533-3.413,8.533-8.533V34.133C413.867,29.013,410.453,25.6,405.333,25.6z M226.133,238.933H192V102.4h34.133V238.933z M268.8,145.067v-51.2V76.8c0-5.12,3.413-8.533,8.533-8.533h85.333c5.12,0,8.533,3.413,8.533,8.533v17.067v51.2V179.2 c0,5.12-3.413,8.533-8.533,8.533s-8.533-3.413-8.533-8.533v-25.6h-68.267v25.6c0,5.12-3.413,8.533-8.533,8.533 c-5.12,0-8.533-3.413-8.533-8.533V145.067z M362.667,213.333c0,5.12-3.413,8.533-8.533,8.533h-68.267 c-5.12,0-8.533-3.413-8.533-8.533c0-5.12,3.413-8.533,8.533-8.533h68.267C359.253,204.8,362.667,208.213,362.667,213.333z M371.2,264.533H268.8c-5.12,0-8.533-3.413-8.533-8.533s3.413-8.533,8.533-8.533h102.4c5.12,0,8.533,3.413,8.533,8.533 S376.32,264.533,371.2,264.533z"></path> </g> </g> </g></svg>'

        const marker = new mapboxgl.Marker(el)
            .setLngLat([stop.stop_lon, stop.stop_lat])
            .addTo(map.current);

        marker.getElement().addEventListener('click', (e) => {
                getVehicleStop(stop.stop_id)
                const vehicle = selectedVehicleRef.current.vehicle
                smsDataRef.current = {vehicle, stop}
                setShowStop(true)
            });

        stopMarkers.current.push({marker, stop})
    };

    const getVehicleStop = async (stopId) => {
        try {
            const url = `http://localhost:3000/stopvehicles?stopid=${stopId}`
            const resp = await fetch(url)
            const labels = await resp.json()
            localStorage.setItem('labels', labels)
            markers.current.forEach(elem => {
                if(!labels.find(el => el == elem.vehicle.label))
                    elem.marker._element.className = 'marker-invisible'
            })
            setShowStop(true)
        } catch(e) {console.log(e)}
    }

    const addMarker = (vehicle) => {
        const linieFavorita = !(!localStorage.getItem('linii_favorite') || (' ' + localStorage.getItem('linii_favorite') + ' ').search(' ' + vehicle.line + ' ') == -1);
        var el = document.createElement('div');

        if (searchParams.get('id') === vehicle.label || (selectedVehicleRef.current && selectedVehicleRef.current.vehicle.label === vehicle.label))
            el.className = 'marker-linie-urmarita ';
        else el.className = linieFavorita ? 'marker-linie-favorita ' : 'marker ';

        if(localStorage.getItem('labels') && !localStorage.getItem('labels').includes(vehicle.label))
            el.className = 'marker-invisible '
        else el.className += unique.current.find(elem => elem[0] === vehicle.line)[1] || searchParams.get('id') === vehicle.label ? 'marker-visible ' : 'marker-invisible ';
        el.innerHTML = vehicle.line;

        const marker = new mapboxgl.Marker(el)
            .setLngLat(vehicle.lngLat)
            .addTo(map.current);

        marker.getElement().addEventListener('click', () => {
            setSelectedVehicle(null)
            selectedVehicleRef.current = null
            stopMarkers.current.forEach(e => e.marker.remove())
            stopMarkers.current = []
            removePolyline()
            popupOpen.current = false
            popupIndex.current = 0

            getStops(vehicle.tripId)
            addPolyline(vehicle)
            popupOpen.current = true
            popupIndex.current = vehicle.label
            setSelectedVehicle({marker, vehicle})
            selectedVehicleRef.current = {marker, vehicle}

            resetMarkers()
            // el.className += ' marker-linie-urmarita';
        });

        markers.current.push({ marker, vehicle });
    };

    const updateMarker = () => {
        if(selectedVehicleRef.current && selectedVehicleRef.current.vehicle) {
            selectedVehicleRef.current.vehicle = markers.current.find(elem => elem.vehicle.label === selectedVehicleRef.current.vehicle.label).vehicle
            addPolyline(selectedVehicleRef.current.vehicle, false)
        }
        markers.current.forEach(marker => {
            let progress = 0;
            const step = 0.02;
            const animateMarker = () => {
                progress += step;
                if (progress > 1) progress = 1;

                const start = marker.vehicle.lngLat;

                const vehi = vehicles.current.find(elem => elem.label == marker.vehicle.label);
                if (vehi != null) {
                    if(selectedVehicle)
                        selectedVehicle({marker, vehi})
                    const end = vehi.lngLat;

                    const lng = start[0] + (end[0] - start[0]) * progress;
                    const lat = start[1] + (end[1] - start[1]) * progress;

                    marker.marker.setLngLat([lng, lat]);
                    marker.vehicle.lngLat = [lng, lat];
                    marker.marker.innerHTML = vehi.line

                    marker.vehicle.tripId = vehi.tripId
                    marker.vehicle.headsign = vehi.headsign

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
                div.className = "zindex100 mapboxgl-ctrl mapboxgl-ctrl-group";
                div.innerHTML = `<button><svg width = '17' height = '17' fill ='#34B5E5' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg></button>`;
                div.addEventListener("contextmenu", (e) => e.preventDefault());
                div.addEventListener("click", () => setShowSettings((prev) => !prev));

                return div;
            }
        }
        const button = new settingsButton();
        map.current.addControl(button, "top-right");
    }

    function addSearchButton() {
        class settingsButton {
            onAdd(map) {
                const div = document.createElement("div");
                div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
                div.innerHTML = `<button><svg width = '17' height = '17' fill ='#34B5E5' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg></button>`;
                div.addEventListener("contextmenu", (e) => e.preventDefault());
                div.addEventListener("click", () => setShowSearch((prev) => !prev));

                return div;
            }
        }
        const button = new settingsButton();
        map.current.addControl(button, "top-right");
    }

    const generateMap = (refresh = false) => {
        map.current = new mapboxgl.Map({
            container: 'map',
            center: [defLng, defLat],
            style: 'mapbox://styles/mapbox/streets-v11',
            zoom: 12,
            attributionControl: false
        });

        map.current.setMaxBounds([
            [23.0000, 46.2500], // Southwest corner
            [24.0000, 47.0000]  // Northeast corner
          ]);
          

        const geo = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true,
        })
        addSettingsButton();
        map.current.addControl(geo);
        addSearchButton();
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
                if(undemibusu === 'destinatii')
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

    function calculateDistance(lat1, lon1, lat2, lon2) {
        function toRadians(degrees) {
            return degrees * (Math.PI / 180);
        }

        const R = 6371;
        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // Distance in kilometers

        const signLat = (lat2 - lat1) < 0 ? -1 : 1;
        const signLon = (lon2 - lon1) < 0 ? -1 : 1;

        const signedDistance = distance * signLat * signLon;

        return signedDistance;
    }

    const addPolyline = useCallback(async (vehicle, animated = true) => {
        if (!map.current.getSource('route')) {
            try {
                var url = 'https://busifybackend-40a76006141a.herokuapp.com/shapes?shapeid=' + vehicle.tripId;

                var response = await fetch(url);
                const shapeData = await response.json();

                const polylineCoordinates = shapeData.map((elem) => [elem.shape_pt_lon, elem.shape_pt_lat])
                let last = polylineCoordinates.length - 1
                let endCoords = polylineCoordinates[last], distMin = 100
                let distVehicleEnd = 1000, distUserEnd = 1000, distMin2 = 1000, nearestCoordsToVehicleIndex = 0

                try {
                    polylineCoordinates.forEach((elem, index) => {
                        const d = calculateDistance(map.current._controls[2]._lastKnownPosition.coords.latitude, map.current._controls[2]._lastKnownPosition.coords.longitude, elem[1], elem[0])
                        distMin = Math.min(distMin, Math.abs(d))

                        const d2 = Math.abs(calculateDistance(vehicle.lngLat[1], vehicle.lngLat[0], elem[1], elem[0]))
                        if(d2 < distMin2) {
                            distMin2 = d2
                            nearestCoordsToVehicleIndex = index;
                        }
                    })
                    distVehicleEnd = Math.abs(calculateDistance(vehicle.lngLat[1], vehicle.lngLat[0], endCoords[1], endCoords[0]))
                    distUserEnd = Math.abs(calculateDistance(map.current._controls[2]._lastKnownPosition.coords.latitude, map.current._controls[2]._lastKnownPosition.coords.longitude, endCoords[1], endCoords[0]))
                } catch(e) {
                    polylineCoordinates.forEach((elem, index) => {
                        const d2 = Math.abs(calculateDistance(vehicle.lngLat[1], vehicle.lngLat[0], elem[1], elem[0]))
                        if(d2 < distMin2) {
                            distMin2 = d2
                            nearestCoordsToVehicleIndex = index;
                        }
                    })
                }
                if (distMin < 0.1 && distUserEnd < distVehicleEnd)
                    endCoords = [map.current._controls[2]._lastKnownPosition.coords.longitude, map.current._controls[2]._lastKnownPosition.coords.latitude]

                if (popupOpen.current) {

                    if(animated){
                        let bounds = new mapboxgl.LngLatBounds();
                        bounds.extend(vehicle.lngLat);
                        bounds.extend(endCoords);
                        const boundsPadding = distVehicleEnd * 10
                        const normalPadding = 110
                        map.current.fitBounds(bounds, {
                            padding: {
                                top: normalPadding,
                                bottom: normalPadding,
                                left: normalPadding,
                                right: normalPadding
                            }, duration: 1250
                        })
                    }

                    const solidCoords = polylineCoordinates.slice(0, nearestCoordsToVehicleIndex)
                    const dottedCoords = polylineCoordinates.slice(nearestCoordsToVehicleIndex, polylineCoordinates.length)

                    let start;
                    const duration = 3750 / 2;

                    if(animated){
                        map.current.addSource('solid route', {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': {
                                    'type': 'LineString',
                                    'coordinates': solidCoords
                                }
                            }
                        });

                        map.current.addLayer({
                            'id': 'solid route',
                            'type': 'line',
                            'source': 'solid route',
                            'layout': {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            'paint': {
                                'line-color': '#888',
                                'line-width': 5,
                            }
                        });
                    
                        const animateLine = (timestamp) => {
                            if (!start) start = timestamp;
                            const elapsed = timestamp - start;

                            const progress = Math.min(elapsed / duration, 1);

                            const currentIndex = Math.floor(progress * (solidCoords.length - 1));

                            const newCoords = solidCoords.slice(0, currentIndex + 1);
                            if(typeof(map.current.getSource('solid route')) !== 'undefined')
                                map.current.getSource('solid route').setData({
                                    type: 'Feature',
                                    properties: {},
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: newCoords,
                                    },
                                });

                            if (progress < 1 && selectedVehicleRef.current) {
                                requestAnimationFrame(animateLine);
                            }
                        };

                        requestAnimationFrame(animateLine);
                    } else {
                        if(typeof(map.current.getSource('dotted route')) !== 'undefined')
                        map.current.getSource('solid route').setData({
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'LineString',
                                coordinates: solidCoords,
                            },
                        });
                    }

                    setTimeout(() => {
                        if(animated){
                            map.current.addSource('dotted route', {
                                'type': 'geojson',
                                'data': {
                                    'type': 'Feature',
                                    'properties': {},
                                    'geometry': {
                                        'type': 'LineString',
                                        'coordinates': dottedCoords
                                    }
                                }
                            });

                            map.current.addLayer({
                                'id': 'dotted route',
                                'type': 'line',
                                'source': 'dotted route',
                                'layout': {
                                    'line-join': 'round',
                                    'line-cap': 'round'
                                },
                                'paint': {
                                    'line-color': '#888',
                                    'line-width': 5,
                                    'line-dasharray': [2, 2]
                                }
                            });

                            start = null;

                            const animateDottedLine = (timestamp) => {
                                if (!start) start = timestamp;
                                const elapsed = timestamp - start;

                                const progress = Math.min(elapsed / duration, 1);

                                const currentIndex = Math.floor(progress * (dottedCoords.length - 1));

                                const newCoords = dottedCoords.slice(0, currentIndex + 1);
                                if(typeof(map.current.getSource('dotted route')) !== 'undefined')
                                    map.current.getSource('dotted route').setData({
                                        type: 'Feature',
                                        properties: {},
                                        geometry: {
                                            type: 'LineString',
                                            coordinates: newCoords,
                                        },
                                    });

                                if (progress < 1 && selectedVehicleRef.current) {
                                    requestAnimationFrame(animateDottedLine);
                                }
                            };

                            requestAnimationFrame(animateDottedLine);
                        } else {
                            if(typeof(map.current.getSource('dotted route')) !== 'undefined')
                                map.current.getSource('dotted route').setData({
                                    type: 'Feature',
                                    properties: {},
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: dottedCoords,
                                    },
                                });
                        }
                    }, animated ? duration + 500 : 0)

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
            } catch (e) { 
                // console.log(e)
            }
        }
    }, []);

    const removePolyline = useCallback((flyback = true) => {
        let hasSomething = false;
        if (map.current.getLayer('solid route')) {
            map.current.removeLayer('solid route');
            hasSomething = true
        }
        if (map.current.getSource('solid route')) {
            map.current.removeSource('solid route');
            hasSomething = true
        }
        if (map.current.getLayer('dotted route')) {
            map.current.removeLayer('dotted route');
            hasSomething = true
        }
        if (map.current.getSource('dotted route')) {
            map.current.removeSource('dotted route');
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
        if (flyback && hasSomething && lastCoords.current[0] !== defLng && lastCoords.current[1] !== defLat) {
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
            const url = 'https://busifybackend-40a76006141a.herokuapp.com/address?latlng=' + lngLat
            console.log(url)
            const data = await fetch(url);
            const resp = await data.json();
            originSearchRef.current.value = resp.results[0].formatted_address
        } catch (e) {
            console.log(e)
        }
    }

    const getRoutes = async () => {
        const origin = 'Cluj Napoca' + originSearchRef.current.value;
        const destination = 'Cluj Napoca ' + destinatiiSearchRef.current.value
        const url = 'https://busifybackend-40a76006141a.herokuapp.com/destinatii?origin=' + origin + '&destination=' + destination

        try {
            const response = await fetch(url)
            const data = await response.json();
            if (data.status === 'OK') {
                console.log(data)
                setInstructions(data.routes[0].legs[0])
                setShowDestinatiiToast(true)
            } else {
                alert('A aparut o eroare! Verifica datele pe care le-ai introdus si incearca din nou!')
                getUserAddress()
                setShowDestinatii(true)
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    const getStops = async (tripId) => {
        try {
            var url = 'https://busifybackend-40a76006141a.herokuapp.com/stops';
            let data = await fetch(url);
            const stops = await data.json();

            url = 'https://busifybackend-40a76006141a.herokuapp.com/stoptimes';
            data = await fetch(url);
            let stopTimes = await data.json();

            stopTimes = stopTimes.filter(elem => elem.trip_id === tripId);
            let newStops = []
            stopTimes.forEach(element => {
                const stop = stops.find(e => e.stop_id === element.stop_id)
                newStops.push(stop)
            });
            newStops.forEach(e => addStopMarker(e))
        } catch { }
    }

    const socketData = useCallback(async (data) => { 
        let vehicleData = data.vehicles
        let tripData = data.trips
        let routeData = data.routes

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
            if (!localStorage.getItem('linii_selectate'))
                localStorage.setItem('linii_selectate', unique.current)
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
            if(searchParams.get("notificationUserId") && !localStorage.getItem('notificationUserId')) {
                localStorage.setItem('notificationUserId', searchParams.get("notificationUserId"))
            }
            if (undemibusu === 'undemiibusu')
                setShowUndemibusu(true)
            else if (searchParams.get('id')) {
                const elem = markers.current.find(elem => elem.vehicle.label === searchParams.get('id'));
                const vehicle = elem.vehicle
                getStops(vehicle.tripId)
                addPolyline(vehicle)
                popupOpen.current = true
                popupIndex.current = vehicle.label
                setSelectedVehicle(elem)
                selectedVehicleRef.current = elem

            } else if (undemibusu === 'destinatii')
                setShowDestinatii(true)
            else {
                let exista = false;
                unique.current.forEach(elem => {
                    if (elem[0] === undemibusu)
                        exista = true
                })

                if (exista) {
                    setShowUndemibusuToast(true)
                    let oneMatch = false;
                    unique.current = unique.current.map((elem) => [elem[0], elem[0] === undemibusu ])
                    unique.current.forEach(elem => {
                        if (elem[1]) oneMatch = true
                    });
                    if (!oneMatch)
                        setShownVehicles();

                    setUniqueLines(unique.current)
                    setCheckAllChecked(!oneMatch)
                    resetMarkers();
                }
            }
            } else {
                updateMarker()
        }
    }, [])

    const handleSocketOns = () => {
        socket.current = io('https://busifybackend-40a76006141a.herokuapp.com/')
        // socket.current = io('http://192.168.0.221:3001')
        socket.current.on('vehicles', data => {socketData(data)})
        socket.current.on('notifications', data => {
            let notificariRamase = JSON.parse(data)
            notificariRamase = notificariRamase.filter(elem => elem.userId === searchParams.get('notificationUserId'))

            let scheduledNotifications = localStorage.getItem('scheduledNotifications') || '[]'
            scheduledNotifications = JSON.parse(scheduledNotifications)

            console.log(scheduledNotifications)
            console.log(notificariRamase)
            const notificariDeTrimis = []
            scheduledNotifications.forEach(elem => {
                const filtru = notificariRamase.filter(notifRamas => (notifRamas.vehicle.vehicle.line === elem[0].vehicle.line && notifRamas.stop.stop_name === elem[1].stop_name))
                console.log(filtru)
                if(filtru.length === 0)
                    notificariDeTrimis.push(elem)
            })

            console.log(notificariDeTrimis)

            localStorage.setItem('scheduledNotifications', JSON.stringify(notificariDeTrimis))
        })
    }

    const handleVisibilityChange = () => {
        console.log("visiblity changed to " + document.visibilityState)
        if(document.visibilityState == "visible") {
           handleSocketOns()
        } else {
            if(socket.current) {
                socket.current.disconnect()
                socket.current = null
            }
        }
    }

    useEffect(() => {
        if (map.current) return;
        localStorage.setItem('labels', '')
        handleSocketOns()
        document.addEventListener("visibilitychange", handleVisibilityChange)
        generateMap()
    }, []);

    return (
        <div className='body'>
            <MapNavbar />
            <div id='map' className="map-container" style={{ visibility: loaded ? 'visible' : 'hidden' }} />
            <Spinner animation="grow" variant='dark' className='spinner-container' style={{ visibility: !loaded ? 'visible' : 'hidden' }} />
            <Search 
                show={showSearch}
                unique={unique}
                setUniqueLines={setUniqueLines}
                setShownVehicles={setShownVehicles}
                setCheckAllChecked={setCheckAllChecked}
                resetMarkers={resetMarkers}
                setShowUndemibusuToast={setShowUndemibusuToast}
                onHide={() => {
                    setShowSearch(false)
                }}
            />
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

                    let exista = false;
                    unique.current.forEach(elem => {
                        if (elem[0].startsWith(undemibususearchref.current.value))
                            exista = undemibususearchref.current.value !== ''
                    })

                    if (exista) {
                        let oneMatch = false;
                        unique.current = unique.current.map((elem) => [elem[0], elem[0].startsWith(undemibususearchref.current.value) && (elem[0].replace(undemibususearchref.current.value, '').toLowerCase() != elem[0].replace(undemibususearchref.current.value, '').toUpperCase() || elem[0].replace(undemibususearchref.current.value, '').length === 0)])
                        unique.current.forEach(elem => {
                            if (elem[1]) oneMatch = true
                        });
                        if (!oneMatch)
                            setShownVehicles();
                        else setShowUndemibusuToast(true);

                        setUniqueLines(unique.current)
                        setCheckAllChecked(!oneMatch)
                        resetMarkers();
                    }
                }} />
            <UndemibusuToast
                header={undemibusu === 'undemiibusu' ? 'Unde mi-i busu?' : 'Căutare'}
                show={showUndemibusuToast}
                onHide={() => {
                    setShownVehicles();
                    setShowUndemibusuToast(false)
                    setUniqueLines(unique.current)
                    setCheckAllChecked(true)
                    resetMarkers();
                }} />
            <VehicleToast
                header={selectedVehicle ? selectedVehicle.vehicle.line : ''}
                show={selectedVehicle}
                vehicle={selectedVehicle ? selectedVehicle.vehicle : new Vehicle()}
                setShowNotification={() => {setShowNotification(true)}}
                map={map}
                onHide={() => {
                    setSelectedVehicle(null)
                    selectedVehicleRef.current = null
                    stopMarkers.current.forEach(e => e.marker.remove())
                    stopMarkers.current = []
                    removePolyline()
                    popupOpen.current = false
                    popupIndex.current = 0
                    resetMarkers()
                }} />
            <StopToast
                header={smsDataRef.current && smsDataRef.current.stop ? smsDataRef.current.stop.stop_name : ''}
                stop={smsDataRef.current && smsDataRef.current.stop ? smsDataRef.current.stop : undefined}
                selectedVehicle = {selectedVehicle}
                show={showStop}
                socket={socket}
                showSms={()=>{setShowSms(true)}}
                markers={markers}
                onHide={() => {
                    localStorage.setItem('labels', '')
                    setShowStop(false)
                    resetMarkers()
                }} />
            <NotificationToast
                show={showNotification}
                title={'Link copiat!'}
                onHide={() => {
                    setShowNotification(false)
                }}
            />
            <Destinatii
                show={showDestinatii}
                destination={destinatiiSearchRef}
                origin={originSearchRef}
                getuseraddress={getUserAddress}
                onHide={() => {
                    setShowDestinatii(false)
                    if (destinatiiSearchRef.current.value)
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
                markers={markers}
                setshowdestinatii={setShowDestinatii}
                setshowdestinatiitost={setShowDestinatiiToast}
            />
            <MessageSMS
                show={showSms}
                setshow={() => {setShowSms(false)}}
                socket={socket}
                smsData={smsDataRef.current}
                uniqueLines={unique}
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