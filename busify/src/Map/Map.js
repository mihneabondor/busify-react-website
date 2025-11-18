import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import React, {createRef, useCallback, useEffect, useRef, useState} from "react";
import './Marker/Marker.css';
import Spinner from 'react-bootstrap/Spinner';
import Undemibusu from "./Undemibusu.js";
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import UndemibusuToast from "./UndemibusuToast.js";
import '../Orare/Traseu.css'
import {io} from 'socket.io-client'
import Search from "./Search.js";
import BottomBar from "../OtherComponents/BottomBar";
import VehicleHighlight from "../OtherComponents/VehicleHighlight";
import ReactDOM from 'react-dom/client';
import Badges from "../OtherComponents/Badges";
import VehicleMarkerWrapper from "../OtherComponents/VehicleMarkerWrapper";
import debounce from 'lodash.debounce';
import NotificationToast from "./NotificationToast";

function Map() {
    var map = useRef();
    var defLng = 23.591423;
    var defLat = 46.770439;
    var lastCoords = useRef([defLng, defLat]);
    var lastZoom = useRef(12)
    var markers = useRef([]);
    const [markersState, setMarkersState ] = useState([]);
    var stopMarkers = useRef([]);
    let vehicles = useRef([]);
    const [uniqueLines, setUniqueLines] = useState([]);
    const [allChecked, setCheckAllChecked] = useState(true);
    let unique = useRef([]);

    const [stopMarkersState, setStopMarkersState] = useState([]);

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

    const [undemibusuBack, setUndemibusuBack] = useState(false);

    const [showDestinatii, setShowDestinatii] = useState(false);
    const [showDestinatiiToast, setShowDestinatiiToast] = useState(false);
    let destinatiiSearchRef = useRef();
    let originSearchRef = useRef();
    const [instructions, setInstructions] = useState()

    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const selectedVehicleRef = useRef(null)

    const [showNotification, setShowNotification] = useState(false)
    const [notificationTitle, setNotificationTitle] = useState('Link copiat!');

    const [showSms, setShowSms] = useState(false)
    const smsDataRef = useRef(null)

    const [showStop, setShowStop] = useState(false)
    const [selectedStop, setSelectedStop] = useState(null)

    const socket = useRef();

    const [nearestStop, setNearestStop] = useState(null)
    const nearestStopRef = useRef(null);

    const updateCancelToken = useRef({ cancelled: false });

    const nav = useNavigate();

    const foundLabelsRef = useRef([]);
    const addStopMarker = (stop, index, length, stops) => {
        var el = document.createElement('div');

        // determine if the current stop is before the nearest stop
        const nearestStopIndex = stops.findIndex(s => s.stop_id === nearestStopRef.current?.stop_id);
        const isPastStop = nearestStopIndex > -1 && index < nearestStopIndex;

        // marker
        el.className = 'traseu-marker traseu-marker-map';

        if (isPastStop) {
            el.className += ' traseu-marker-trecut';
        }

        el.innerHTML = index + 1;

        const marker = new mapboxgl.Marker(el)
            .setLngLat([stop.stop_lon, stop.stop_lat]);

        if (index !== 0 && index !== length - 1) {
            marker.addTo(map.current);
        }

        marker.getElement().addEventListener('click', (e) => {
            smsDataRef.current = null;
            setShowStop(false);

            setTimeout(() => {
                const vehicle = selectedVehicleRef.current.vehicle;
                smsDataRef.current = { vehicle, stop };
                setSelectedStop(stop);
                setShowStop(true);
            }, 100);
        });

        stopMarkers.current.push({ marker, stop });
        setStopMarkersState(stopMarkers.current);
    };

    const hiddenMarkerCondition = (vehicle) => {
        if (foundLabelsRef.current.length > 0) {
            // Only show vehicles whose label is in foundLabels
            return !foundLabelsRef.current.includes(vehicle.label);
        }
        return (
            (selectedVehicleRef.current && selectedVehicleRef.current.vehicle.label !== vehicle.label) ||
            (unique.current.find(elem => elem[0] === vehicle.line)[1] === false && selectedVehicleRef.current?.vehicle?.line !== vehicle.line)
        );
    }

    // Offset a [lng, lat] point to the right of the direction from start to end by 'distance' meters
    function offsetToRight(start, end, distance = 0.0004) {
        // Convert to radians
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;

        // Calculate direction angle
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const angle = Math.atan2(dy, dx);

        // Perpendicular angle to the right
        const rightAngle = angle - Math.PI / 2;

        // Offset in degrees (approximate, works for small distances)
        const dLng = (distance * Math.cos(rightAngle));
        const dLat = (distance * Math.sin(rightAngle));

        return [start[0] + dLng, start[1] + dLat];
    }

    const addMarker = (vehicle) => {
        const existingIndex = markers.current.findIndex(m => m.vehicle.label === vehicle.label);
        if (existingIndex !== -1) {
            markers.current[existingIndex].marker.remove();
            markers.current.splice(existingIndex, 1);
        }

        const el = document.createElement('div');
        const root = ReactDOM.createRoot(el);

        const markerComponentRef = createRef();

        root.render(
            <VehicleMarkerWrapper
                ref={markerComponentRef}
                initialVehicle={{
                    ...vehicle,
                    hidden:
                        hiddenMarkerCondition(vehicle)
                }}
                mapBearing={map.current.getBearing()}
            />
        );

        el.className = "marker";

        const offsetLngLat = (vehicle.nextCoords && vehicle.nextCoords[0] !== undefined)
            ? offsetToRight(vehicle.lngLat, vehicle.nextCoords)
            : vehicle.lngLat;

        const mapboxMarker = new mapboxgl.Marker(el)
            .setLngLat(offsetLngLat)
            .addTo(map.current);

        mapboxMarker.getElement().addEventListener('click', async () => {
            selectedVehicleRef.current = null;
            stopMarkers.current.forEach(e => e.marker.remove());
            stopMarkers.current = [];
            removePolyline();
            popupOpen.current = false;
            popupIndex.current = 0;
            setShowUndemibusuToast(false);

            await getStops(vehicle.tripId);
            addPolyline(vehicle);

            popupOpen.current = true;
            popupIndex.current = vehicle.label;

            setSelectedVehicle({ marker: mapboxMarker, vehicle });
            selectedVehicleRef.current = { marker: mapboxMarker, vehicle };

            resetMarkers();

            setTimeout(() => {
                updateSelectedVehicleAndStops();
            }, 1000)
        });

        // Save everything for later update
        markers.current.push({
            marker: mapboxMarker,
            vehicle,
            reactRef: markerComponentRef
        });
    };

    // store timeout across renders
    const updateMarkerTimeout = useRef(null);

    const debouncedUpdateMarker = () => {
        if (updateMarkerTimeout.current) {
            clearTimeout(updateMarkerTimeout.current);
        }
        updateMarkerTimeout.current = setTimeout(() => {
            if (vehicles.current.length > 2000) {
                console.warn("Skipping updateMarker: too many vehicles", vehicles.current.length);
                return;
            }
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => updateMarker(), { timeout: 200 });
            } else {
                updateMarker();
            }
        }, 1000); // 1 second debounce
    };

    const updateMarker = () => {
        // Cancel any in-progress update
        if (updateCancelToken.current) {
            updateCancelToken.current.cancelled = true;
        }

        updateCancelToken.current = { cancelled: false };
        const token = updateCancelToken.current;

        const currentVehicles = vehicles.current;
        const currentVehicleLabels = currentVehicles.map(v => v.label);
        const existingLabels = markers.current.map(m => m.vehicle.label);

        // Remove markers for vehicles that no longer exist
        markers.current = markers.current.filter(entry => {
            const stillExists = currentVehicleLabels.includes(entry.vehicle.label);
            if (!stillExists) entry.marker.remove();
            return stillExists;
        });

        // Find new vehicles
        const newVehicles = currentVehicles.filter(v => !existingLabels.includes(v.label));
        const BATCH_SIZE = 20;
        let addIndex = 0;

        const addNextBatch = () => {
            if (token.cancelled) return;
            const batch = newVehicles.slice(addIndex, addIndex + BATCH_SIZE);
            batch.forEach(elem => {
                let exists = unique.current.some(uniqueLine => uniqueLine[0] === elem.line);
                if (exists) {
                    try { addMarker(elem); }
                    catch (e) { console.log("Error adding marker for", elem, e); }
                }
            });
            addIndex += BATCH_SIZE;
            if (addIndex < newVehicles.length) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(addNextBatch, { timeout: 200 });
                } else {
                    setTimeout(addNextBatch, 100);
                }
            } else {
                updateExistingMarkersInChunks();
            }
        };

        const updateExistingMarkersInChunks = () => {
            const selectedLabel = selectedVehicleRef.current?.vehicle?.label;
            const entries = [...markers.current].sort((a, b) => {
                if (a.vehicle.label === selectedLabel) return -1;
                if (b.vehicle.label === selectedLabel) return 1;

                const aVisible = a.marker.getElement().style.display !== "none";
                const bVisible = b.marker.getElement().style.display !== "none";
                if (aVisible && !bVisible) return -1;
                if (!aVisible && bVisible) return 1;
                return 0;
            });

            let index = 0;
            const MAX_ANIMATED_MARKERS = 20;
            const animations = new Set();

            const processNextBatch = () => {
                if (token.cancelled) return;
                const batch = entries.slice(index, index + BATCH_SIZE);
                let animatedCount = 0;

                batch.forEach(entry => {
                    const vehi = currentVehicles.find(v => v.label === entry.vehicle.label);
                    if (!vehi) return;

                    const start = entry.vehicle.lngLat;
                    const end = (vehi.nextCoords && vehi.nextCoords[0] !== undefined)
                        ? offsetToRight(vehi.lngLat, vehi.nextCoords)
                        : vehi.lngLat;

                    const distance = Math.hypot(end[0]-start[0], end[1]-start[1]);
                    const isVisible = entry.marker.getElement().style.display !== "none";
                    const shouldAnimate = isVisible && distance > 0.0001 && animatedCount < MAX_ANIMATED_MARKERS;

                    if (shouldAnimate) {
                        animatedCount++;
                        animations.add({ entry, start, end, startTime: performance.now(), duration: 500 });
                    } else if (distance > 0.00001) {
                        entry.marker.setLngLat(end);
                        entry.vehicle.lngLat = vehi.lngLat;
                    }

                    if (entry.reactRef?.current?.updateVehicle) {
                        entry.reactRef.current.updateVehicle({ ...vehi, hidden: hiddenMarkerCondition(vehi) });
                    }

                    entry.vehicle = { ...vehi };
                });

                index += BATCH_SIZE;
                if (index < entries.length) setTimeout(processNextBatch, 50);
                else if (!token.cancelled) updateSelectedVehicleAndStops();
            };

            const animateAll = (time) => {
                if (token.cancelled) {
                    animations.clear();
                    return;
                }
                const finished = [];
                animations.forEach(anim => {
                    const elapsed = time - anim.startTime;
                    let progress = Math.min(1, elapsed / anim.duration);
                    const lng = anim.start[0] + (anim.end[0]-anim.start[0]) * progress;
                    const lat = anim.start[1] + (anim.end[1]-anim.start[1]) * progress;
                    anim.entry.marker.setLngLat([lng, lat]);
                    anim.entry.vehicle.lngLat = [lng, lat];
                    if (progress >= 1) finished.push(anim);
                });
                finished.forEach(anim => animations.delete(anim));
                if (animations.size > 0) requestAnimationFrame(animateAll);
            };

            processNextBatch();
            requestAnimationFrame(animateAll);
        };

        addNextBatch();
    };


    const updateSelectedVehicleAndStops = () => {
        if (selectedVehicleRef.current) {
            const updatedVehicle = markers.current.find(elem =>
                elem.vehicle.label === selectedVehicleRef.current.vehicle.label)?.vehicle;

            if (updatedVehicle) {
                selectedVehicleRef.current.vehicle = updatedVehicle;
                setSelectedVehicle(prev => ({
                    ...prev,
                    vehicle: { ...updatedVehicle }
                }));
                addPolyline(updatedVehicle, false);

                const stops = stopMarkers.current.map(elem => elem.stop);
                // stopMarkers.current.forEach(stopMarker => stopMarker.marker.remove());
                // stopMarkers.current = [];
                getStops(selectedVehicleRef.current.vehicle.tripId);
                // stops.forEach((stop, index) => addStopMarker(stop, index, stops.length));
            }
        }
    };

    function getIndex(target, arr) {
        for (let i = 0; i < arr.length; i++)
            if (arr[i][0] === target)
                return i
        return -1;
    }

    const resetMarkers = () => {
        const BATCH_SIZE = 25;

        // Step 1: Remove existing markers in chunks
        const toRemove = [...markers.current]; // Clone to avoid mutation issues
        markers.current = []; // Clear marker tracking immediately

        let removeIndex = 0;

        const removeNextBatch = () => {
            const batch = toRemove.slice(removeIndex, removeIndex + BATCH_SIZE);
            batch.forEach(elem => elem.marker.remove());

            removeIndex += BATCH_SIZE;
            if (removeIndex < toRemove.length) {
                setTimeout(removeNextBatch, 50);
            } else {
                addMarkersInChunks(); // Start adding new markers after all are removed
            }
        };

        // Step 2: Add new markers in chunks
        const addMarkersInChunks = () => {
            const eligibleVehicles = vehicles.current.filter(elem =>
                unique.current.some(uniqueLine => uniqueLine[0] === elem.line)
            );

            let addIndex = 0;

            const addNextBatch = () => {
                const batch = eligibleVehicles.slice(addIndex, addIndex + BATCH_SIZE);
                batch.forEach(elem => addMarker(elem));

                addIndex += BATCH_SIZE;
                if (addIndex < eligibleVehicles.length) {
                    setTimeout(addNextBatch, 200);
                }
                checkMarkerVisibility()
            };

            addNextBatch();
        };

        removeNextBatch();
        setMarkersState(markers.current);
    };

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

    const generateMap = async (refresh = false) => {
        try {
            const request = await fetch('https://busifyserver.onrender.com/mapbox');
            const data = await request.json();
            mapboxgl.accessToken = data.accessToken;
            map.current = new mapboxgl.Map({
                container: 'map',
                center: [defLng, defLat],
                style: data.style,
                zoom: 14,
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
            addSearchButton();
            map.current.addControl(geo);
            map.current.on('load', () => {
                handleSocketOns();
                if (refresh)
                    map.current.flyTo({
                        center: lastCoords.current,
                        duration: 1500,
                        zoom: lastZoom.current,
                        essential: true
                    })
                else if (!popupOpen.current) {
                    geo.trigger();
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const { latitude, longitude } = position.coords;
                            map.current.jumpTo({
                                center: [longitude, latitude],
                                zoom: 14,
                                duration: 1000
                            });

                            if (undemibusu === 'destinatii') {
                                setTimeout(() => {
                                    getUserAddress();
                                }, 1000);
                            }
                        },
                        (error) => {
                            console.error("Geolocation error:", error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 5000, // optional
                            maximumAge: 10000 // optional, use cached if recent
                        }
                    );
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
            map.current.on('rotate', () => {
                const mapBearing = map.current.getBearing() * Math.PI / 180; // convert to radians

                markers.current.forEach(({ marker }) => {
                    const el = marker.getElement();
                    const arrowEl = el.querySelector('.marker-arrow');

                    if (arrowEl) {
                        // Original values from dataset (string → number)
                        const originalBearing = parseFloat(arrowEl.dataset.bearing) || 0;
                        const originalDx = parseFloat(arrowEl.dataset.dx) || 0;
                        const originalDy = parseFloat(arrowEl.dataset.dy) || 0;

                        // Adjust bearing in degrees (rotate arrow to compensate map rotation)
                        const newBearing = originalBearing - (map.current.getBearing());

                        // Rotate dx/dy offsets by negative mapBearing to move arrow properly
                        // Use 2D rotation formula:
                        // x' = x * cos(θ) - y * sin(θ)
                        // y' = x * sin(θ) + y * cos(θ)
                        const cosB = Math.cos(-mapBearing);
                        const sinB = Math.sin(-mapBearing);

                        const rotatedDx = originalDx * cosB - originalDy * sinB;
                        const rotatedDy = originalDx * sinB + originalDy * cosB;

                        // Update arrow styles
                        arrowEl.style.transform = `rotate(${newBearing}deg)`;
                        arrowEl.style.left = `${(el.clientWidth / 2) + rotatedDx - (41 / 2)}px`;
                        arrowEl.style.top = `${(el.clientHeight / 2) + rotatedDy - (41 / 2)}px`;
                    }
                });
            });
            // Debounced version for smooth updates without over-triggering

            // Attach the listener (usually inside useEffect)

            const debouncedCheckMarkerVisibility = debounce(checkMarkerVisibility, 200);
            map.current.on('moveend', debouncedCheckMarkerVisibility);
        } catch {
        }
    }

    const checkMarkerVisibility = () => {
        if (!map.current) return;

        const bounds = map.current.getBounds();

        const paddingLng = (bounds.getEast() - bounds.getWest()) * 0.4;
        const paddingLat = (bounds.getNorth() - bounds.getSouth()) * 0.4;

        const paddedBounds = new mapboxgl.LngLatBounds(
            [bounds.getWest() - paddingLng, bounds.getSouth() - paddingLat],
            [bounds.getEast() + paddingLng, bounds.getNorth() + paddingLat]
        );

        const entries = [...markers.current];
        const BATCH_SIZE = 25;
        let index = 0;

        const processNextBatch = () => {
            const batch = entries.slice(index, index + BATCH_SIZE);

            batch.forEach(({ vehicle, marker }) => {
                const el = marker.getElement();
                const inBounds = paddedBounds.contains(vehicle.lngLat);
                const currentlyHidden = el.style.display === "none";

                if (inBounds && currentlyHidden) {
                    el.style.display = "block";
                } else if (!inBounds && !currentlyHidden) {
                    el.style.display = "none";
                }
            });

            index += BATCH_SIZE;
            if (index < entries.length) {
                setTimeout(processNextBatch, 50); // non-blocking continuation
            }
        };

        processNextBatch();
    };


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
                var url = 'https://busifyserver.onrender.com/shapes?shapeid=' + vehicle.tripId;

                var response = await fetch(url);
                const shapeData = await response.json();

                const polylineCoordinates = shapeData.map((elem) => [elem.shape_pt_lon, elem.shape_pt_lat])
                let last = polylineCoordinates.length - 1
                let endCoords = polylineCoordinates[last], distMin = 100
                let distVehicleEnd = 1000, distUserEnd = 1000, distMin2 = 1000, nearestCoordsToVehicleIndex = 0

                let closestCoordsBetweenUserPolyline = [], closestDistanceBetweenUserPolyline = 100;

                try {
                    polylineCoordinates.forEach((elem, index) => {
                        const d = calculateDistance(map.current._controls[2]._lastKnownPosition.coords.latitude, map.current._controls[2]._lastKnownPosition.coords.longitude, elem[1], elem[0])
                        distMin = Math.min(distMin, Math.abs(d))

                        if(Math.abs(d) < closestDistanceBetweenUserPolyline) {
                            closestDistanceBetweenUserPolyline = Math.abs(d);
                            closestCoordsBetweenUserPolyline = elem
                        }

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

                let centratingOnUser = false;
                if (distMin < 0.15 && distUserEnd < distVehicleEnd) {
                    endCoords = [map.current._controls[2]._lastKnownPosition.coords.longitude, map.current._controls[2]._lastKnownPosition.coords.latitude]
                    centratingOnUser = true;
                }

                if (popupOpen.current) {

                    if(animated){
                        let bounds = new mapboxgl.LngLatBounds();
                        bounds.extend(vehicle.lngLat);

                        if(centratingOnUser) {
                            polylineCoordinates.filter(elem => (polylineCoordinates.indexOf(elem) <= polylineCoordinates.indexOf(closestCoordsBetweenUserPolyline) && polylineCoordinates.indexOf(elem) >= nearestCoordsToVehicleIndex)).forEach(elem => {
                                bounds.extend(elem);
                            })
                            console.log("intram in centrating on user")
                        } else {
                            polylineCoordinates.filter(elem => (polylineCoordinates.indexOf(elem) >= nearestCoordsToVehicleIndex)).forEach(elem => {
                                bounds.extend(elem);
                            })
                            console.log("nu intram in centrating on user")
                        }
                        const normalPadding = 110
                        const padding= {
                            top: normalPadding,
                            bottom: normalPadding + 50,
                            left: normalPadding - 30,
                            right: normalPadding - 30
                        }
                        map.current.fitBounds(bounds, {
                            padding: padding,
                            duration: 1250,
                            maxZoom: 14
                        })

                    }

                    const solidCoords = polylineCoordinates.slice(1, nearestCoordsToVehicleIndex)
                    const dottedCoords = polylineCoordinates.slice(nearestCoordsToVehicleIndex, polylineCoordinates.length - 1)

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
                                'line-color': '#62A7FB',
                                'line-width': 3,
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
                                    'line-color': '#62A7FB',
                                    'line-width': 3,
                                    'line-dasharray': [3, 3]
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

                    const createCircleImage = (color) => {
                        const circleSize = 45; // Diameter of the colored part
                        const borderWidth = 7; // Thickness of the white border
                        const canvasSize = circleSize + borderWidth * 2; // Expand canvas to fit border

                        const canvas = document.createElement('canvas');
                        canvas.width = canvasSize;
                        canvas.height = canvasSize;
                        const ctx = canvas.getContext('2d');

                        // Drop shadow
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
                        ctx.shadowBlur = 6;

                        // White outer circle (bigger background)
                        ctx.beginPath();
                        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
                        ctx.fillStyle = 'white';
                        ctx.fill();

                        // Outer colored ring (smaller than the white circle)
                        ctx.beginPath();
                        ctx.arc(canvasSize / 2, canvasSize / 2, circleSize / 2, 0, Math.PI * 2);
                        ctx.fillStyle = color;
                        ctx.fill();

                        // Inner white circle
                        ctx.beginPath();
                        ctx.arc(canvasSize / 2, canvasSize / 2, circleSize / 4, 0, Math.PI * 2);
                        ctx.fillStyle = 'white';
                        ctx.fill();

                        return {
                            width: canvasSize,
                            height: canvasSize,
                            data: ctx.getImageData(0, 0, canvasSize, canvasSize).data
                        };
                    };

                    if (!map.current.hasImage('circle-purple')) {
                        map.current.addImage('circle-purple', createCircleImage('#8A56A3'), { pixelRatio: 2 }); // Purple
                    }
                    if (!map.current.hasImage('circle-blue')) {
                        map.current.addImage('circle-blue', createCircleImage('#2D8CFE'), { pixelRatio: 2 }); // Blue
                    }

                    const circleGeojson = {
                        'type': 'FeatureCollection',
                        'features': [
                            {
                                'type': 'Feature',
                                'properties': { icon: 'circle-purple' },
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': polylineCoordinates[0] // Start
                                }
                            },
                            {
                                'type': 'Feature',
                                'properties': { icon: 'circle-blue' },
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': polylineCoordinates[last] // End
                                }
                            }
                        ]
                    };

                    if (map.current.getSource('dot-point')) {
                        // Just update the data
                        map.current.getSource('dot-point').setData(circleGeojson);
                    } else {
                        // First time setup
                        map.current.addSource('dot-point', {
                            'type': 'geojson',
                            'data': circleGeojson
                        });

                        map.current.addLayer({
                            'id': 'layer-with-colored-circles',
                            'type': 'symbol',
                            'source': 'dot-point',
                            'layout': {
                                'icon-image': ['get', 'icon'],
                                'icon-size': 1,
                                'icon-allow-overlap': true
                            }
                        });
                    }
                }
            } catch (e) {}
        }
    }, []);

    const removePolyline = useCallback((flyback = true) => {
        let hasSomething = false;

        // Remove solid and dotted route layers/sources
        ['solid route', 'dotted route'].forEach((id) => {
            if (map.current.getLayer(id)) {
                map.current.removeLayer(id);
                hasSomething = true;
            }
            if (map.current.getSource(id)) {
                map.current.removeSource(id);
                hasSomething = true;
            }
        });

        // Remove pulsing dot layer (older setup, safe to keep)
        if (map.current.getLayer('layer-with-pulsing-dot')) {
            map.current.removeLayer('layer-with-pulsing-dot');
            hasSomething = true;
        }

        // Remove colored circles layer and source
        if (map.current.getLayer('layer-with-colored-circles')) {
            map.current.removeLayer('layer-with-colored-circles');
            hasSomething = true;
        }
        if (map.current.getSource('dot-point')) {
            map.current.removeSource('dot-point');
            hasSomething = true;
        }

        // Optional: remove images (Mapbox doesn't allow re-adding with the same name unless removed)
        ['circle-purple', 'circle-blue'].forEach((img) => {
            if (map.current.hasImage(img)) {
                map.current.removeImage(img);
            }
        });

        // Fly back to original location if needed
        if (
            flyback &&
            hasSomething &&
            lastCoords.current[0] !== defLng &&
            lastCoords.current[1] !== defLat
        ) {
            map.current.flyTo({
                center: lastCoords.current,
                duration: 2000,
                zoom: lastZoom.current,
                essential: true
            });
        }
    }, []);

    const removeCircles = () => {
        if (map.current.getLayer('layer-with-colored-circles')) {
            map.current.removeLayer('layer-with-colored-circles');
        }
        if (map.current.getSource('dot-point')) {
            map.current.removeSource('dot-point');
        }

        // Optional: remove images (Mapbox doesn't allow re-adding with the same name unless removed)
        ['circle-purple', 'circle-blue'].forEach((img) => {
            if (map.current.hasImage(img)) {
                map.current.removeImage(img);
            }
        });
    }

    const setShownVehicles = () => {
        let s = [];
        if (localStorage.getItem('linii_selectate')) s = localStorage.getItem('linii_selectate').split(',');
        let saved = [];
        for (let i = 0; i < s.length; i += 2)
            saved.push([s[i], s[i + 1] === 'true']);

        for (let i = 0; i < saved.length; i++) {
            let index = getIndex(saved[i][0], unique.current)
            if (index !== -1) {
                unique.current[index][1] = saved[i][1];
                if (saved[i][1] === false) {
                    setCheckAllChecked(false)
                }
            }
        }
    }

    const getUserAddress = async () => {
        try {
            const lngLat = map.current._controls[2]._lastKnownPosition.coords.latitude + ',' + map.current._controls[2]._lastKnownPosition.coords.longitude;
            const url = 'https://busifyserver.onrender.com/address?latlng=' + lngLat
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
        const url = 'https://busifyserver.onrender.com/destinatii?origin=' + origin + '&destination=' + destination

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
            var url = 'https://busifyserver.onrender.com/stops';
            let data = await fetch(url);
            const stops = await data.json();

            url = 'https://busifyserver.onrender.com/stoptimes';
            data = await fetch(url);
            let stopTimes = await data.json();

            stopTimes = stopTimes.filter(elem => elem.trip_id === tripId);
            let newStops = []
            stopTimes.forEach(element => {
                const stop = stops.find(e => e.stop_id === element.stop_id)
                newStops.push(stop)
            });
            stopMarkers.current.forEach(stopMarker => stopMarker.marker.remove());
            stopMarkers.current = [];
            newStops.forEach((e,index) => addStopMarker(e, index, newStops.length, newStops))
        } catch { }
    }

    const lastVehiclesRef = useRef([]);

    const socketData = useCallback(async (data) => {
        // Build new vehicle list
        const newVehicles = data.map(item =>
            new Vehicle(
                item.id, item.label, item.latitude, item.longitude, item.speed,
                item.tripId, item.routeId, item.bike, item.wheelchair, item.headsign,
                item.route, item.line, item.vehicleType, item.currentLatitude,
                item.currentLongitude, item.nextLatitude, item.nextLongitude
            )
        );

        // 🔑 Compare new vs old
        const hasChanged = () => {
            if (newVehicles.length !== lastVehiclesRef.current.length) return true;

            for (let i = 0; i < newVehicles.length; i++) {
                const nv = newVehicles[i];
                const ov = lastVehiclesRef.current[i];

                // Compare only properties that matter for markers
                if (
                    nv.label !== ov.label ||
                    nv.line !== ov.line ||
                    Math.abs(nv.latitude - ov.latitude) > 0.00001 ||
                    Math.abs(nv.longitude - ov.longitude) > 0.00001
                ) {
                    return true;
                }
            }
            return false;
        };

        if (!loaded && !loadedFirstTime) {
            // ✅ Initial setup (no diffing here, always run)
            vehicles.current = newVehicles;

            let s = [];
            if (localStorage.getItem('linii_selectate'))
                s = localStorage.getItem('linii_selectate').split(',');

            try {
                const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
                const buses_basic = await resp.json();
                const joinArray = (arr) => {
                    arr.forEach(elem => unique.current.push([elem.name, true]));
                };
                joinArray(buses_basic.urbane);
                joinArray(buses_basic.metropolitane);
                joinArray(buses_basic.market);
                joinArray(buses_basic.noapte);
            } catch (err) {
                console.log(err);
            }

            let saved = [];
            for (let i = 0; i < s.length; i += 2)
                saved.push([s[i], s[i + 1] === 'true']);

            for (let i = 0; i < saved.length; i++) {
                let index = getIndex(saved[i][0], unique.current);
                if (index !== -1) {
                    unique.current[index][1] = saved[i][1];
                    if (saved[i][1] === false)
                        setCheckAllChecked(false);
                }
            }
            setUniqueLines(unique.current);

            if (!localStorage.getItem('linii_selectate'))
                localStorage.setItem('linii_selectate', unique.current);
            if (!localStorage.getItem('iconite'))
                localStorage.setItem('iconite', true);
            if (!localStorage.getItem('sageti'))
                localStorage.setItem('sageti', true);

            loadedFirstTime = true;
            setLoaded(true);

            vehicles.current.forEach(elem => {
                let exista = false;
                unique.current.forEach((uniqueLine) => {
                    if (uniqueLine[0] === elem.line)
                        exista = true;
                });
                if (exista) addMarker(elem);
            });

            if (searchParams.get("notificationUserId")) {
                localStorage.setItem('notificationUserId', searchParams.get("notificationUserId"));
            }

            if (undemibusu === 'undemiibusu') {
                setShowUndemibusu(true);
            } else if (searchParams.get('id')) {
                const elem = markers.current.find(elem => elem.vehicle.label === searchParams.get('id'));
                const vehicle = elem.vehicle;
                selectedVehicleRef.current = null;
                stopMarkers.current.forEach(e => e.marker.remove());
                stopMarkers.current = [];
                removePolyline();
                popupOpen.current = false;
                popupIndex.current = 0;
                setShowUndemibusuToast(false);

                await getStops(vehicle.tripId);
                addPolyline(vehicle);

                popupOpen.current = true;
                popupIndex.current = vehicle.label;

                setSelectedVehicle({ marker: elem.marker, vehicle });
                selectedVehicleRef.current = { marker: elem.marker, vehicle };

                resetMarkers();
            } else if (undemibusu === 'destinatii') {
                setShowDestinatii(true);
            } else if (!localStorage.hasOwnProperty("onboarding_done")) {
                nav('/onboarding');
            } else {
                let exista = false;
                unique.current.forEach(elem => {
                    if (elem[0] === undemibusu)
                        exista = true;
                });

                if (exista) {
                    setShowUndemibusuToast(true);
                    let oneMatch = false;
                    unique.current = unique.current.map((elem) => [elem[0], elem[0] === undemibusu]);
                    unique.current.forEach(elem => {
                        if (elem[1]) oneMatch = true;
                    });
                    if (!oneMatch) setShownVehicles();

                    setUniqueLines(unique.current);
                    setCheckAllChecked(!oneMatch);
                    resetMarkers();
                }
            }
        } else {
            if (hasChanged()) {
                console.log("update detected")
                vehicles.current = newVehicles;
                lastVehiclesRef.current = newVehicles;
                debouncedUpdateMarker();
            }
        }
    }, []);

    const handleSocketOns = (visChange = false) => {
        socket.current = io('https://busifyserver.onrender.com')
        // socket.current = io('http://192.168.0.221:3001')
        socket.current.on('allVehicleData', data => {
            console.log("new data")
            socketData(data)
            setTimeout(() => {
                checkMarkerVisibility()
                if(selectedVehicleRef.current && visChange) {
                    map.current.flyTo({
                        center: selectedVehicleRef.current.vehicle.lngLat,
                        duration: 1000,
                        zoom: 14,
                        essential: true
                    });
                    lastCoords.current = selectedVehicleRef.current.vehicle.lngLat;
                    lastZoom.current = 14
                }
                visChange = false
            }, 1500)
        })
        socket.current.on('notifications', data => {
            let notificariRamase = JSON.parse(data)
            notificariRamase = notificariRamase.filter(elem => elem.userId === searchParams.get('notificationUserId'))
            localStorage.setItem('scheduledNotifications', JSON.stringify(notificariRamase))
        })
    }

    const handleVisibilityChange = () => {
        console.log("visiblity changed to " + document.visibilityState)
        if(document.visibilityState === "visible") {
            handleSocketOns(true)
        } else {
            if(socket.current) {
                socket.current.disconnect()
                socket.current = null
            }
        }
    }

    const revertFitBoundsPadding = () => {
        const normalPadding = 110
        const padding= {
            top: -normalPadding,
            bottom: -(normalPadding + 50),
            left: -(normalPadding - 30),
            right: -(normalPadding - 30)
        }
        const bounds = map.current.getBounds(); // original map bounds
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const nePoint = map.current.project(ne);
        const swPoint = map.current.project(sw);
        const paddedNE = {
            x: nePoint.x + padding.right,
            y: nePoint.y + padding.top
        };
        const paddedSW = {
            x: swPoint.x + padding.left,
            y: swPoint.y + padding.bottom
        };

        const newNE = map.current.unproject(paddedNE);
        const newSW = map.current.unproject(paddedSW);

        const paddedBounds = new mapboxgl.LngLatBounds(newSW, newNE);

        map.current.fitBounds(map.current.getBounds(), {
            padding: paddedBounds,
            duration: 100,
            maxZoom: map.current.getZoom()
        })
    }

    const donationNotification = () => {
        const setNextDate = (days) => {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + days);
            localStorage.setItem("donation_notification_next_date", nextDate.toISOString());
        }
        if(!localStorage.hasOwnProperty("donation_notification_next_date")){
            setNextDate(2);
        } else if(new Date() > new Date(localStorage.getItem("donation_notification_next_date"))) {
            setNotificationTitle("Îți place Busify? Susține dezvoltarea aplicației printr-o donație din pagina de setări. Mulțumim!")
            setShowNotification(true);
            setNextDate(30);
        }
    }

    useEffect(() => {
        if (loaded && map.current) {
            map.current.resize();
        }
    }, [loaded]);

    useEffect(() => {
        if (map.current) return;
        // console.log("Map mounted");

        localStorage.setItem('labels', '');
        generateMap();
        donationNotification();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (socket.current) {
                socket.current.disconnect();
                socket.current = null;
            }
            // console.log("Map unmounted");
        };
    }, []);

    return (
        <div className='body'>
            <Badges/>
            <div id='map' className="map-container" style={{ visibility: loaded ? 'visible' : 'hidden' }} />
            <Spinner animation="grow" variant='dark' className='spinner-container' style={{ visibility: !loaded ? 'visible' : 'hidden' }} />
            <Search 
                show={showSearch}
                unique={unique}
                vehicles={markers.current.map(elem=> elem.vehicle)}
                setUniqueLines={setUniqueLines}
                setShownVehicles={setShownVehicles}
                setCheckAllChecked={setCheckAllChecked}
                resetMarkers={resetMarkers}
                foundLabelsRef={foundLabelsRef}
                setShowUndemibusuToast={setShowUndemibusuToast}
                onHide={() => {
                    setShowSearch(false)
                }}
                onHideSearch={() => {
                    setShowSearch(false)
                    resetMarkers()
                    setShowUndemibusuToast(true)
                }}
            />
            <NotificationToast
                show={showNotification}
                onHide={()=>{setShowNotification(false)}}
                title={notificationTitle}
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
                        unique.current = unique.current.map((elem) => [elem[0], elem[0].startsWith(undemibususearchref.current.value) && (elem[0].replace(undemibususearchref.current.value, '').toLowerCase() !== elem[0].replace(undemibususearchref.current.value, '').toUpperCase() || elem[0].replace(undemibususearchref.current.value, '').length === 0)])
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
                markers={markers}
                markersState={markersState}
                foundLabelsRef={foundLabelsRef}
                unique={unique}
                onHide={() => {
                    setShownVehicles();
                    setShowUndemibusuToast(false)
                    setUniqueLines(unique.current)
                    foundLabelsRef.current = []
                    resetMarkers();
                    setUndemibusuBack(true)
                }} />
            <VehicleHighlight
                show={selectedVehicle}
                onHide={() => {
                    setShownVehicles()
                    setSelectedVehicle(null)
                    selectedVehicleRef.current = null
                    setTimeout(() => {
                        stopMarkers.current.forEach(e => e.marker.remove())
                        stopMarkers.current = []
                    }, 500)
                    removePolyline()
                    popupOpen.current = false
                    popupIndex.current = 0
                    resetMarkers()

                    if(!undemibusuBack) {
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

                    setTimeout(() => {
                        revertFitBoundsPadding()
                    }, 1400)
                }}
                vehicle={selectedVehicle?.vehicle}
                vehicleRef={selectedVehicleRef && selectedVehicleRef.current ? selectedVehicleRef.current.vehicle : null}
                stops={stopMarkersState.map(elem => elem.stop)}
                map={map}
                neareastStop={nearestStop}
                setNearestStop={setNearestStop}
                socket={socket}
                selectedStop={selectedStop}
                nearestStopRef={nearestStopRef}
                copyLinkNotification = {() => {
                    setNotificationTitle("Link copiat!")
                    setShowNotification(true)
                }}
            />
            <BottomBar/>
        </div >
    );
}

export default Map;

class Vehicle {
    constructor(id, label, latitude, longitude, speed, tripId, routeId, bike, wheelchair, headsign, route, line, vehicleType, currentLat, currentLng, nextLat, nextLng) {
        this.id = id;
        this.label = label;
        this.lngLat = [longitude, latitude];
        this.speed = speed;
        this.tripId = tripId;
        this.routeId = routeId;
        this.bike = bike;
        this.wheelchair = wheelchair;
        this.headsign = headsign;
        this.route = route;
        this.line = line;
        this.vehicleType = vehicleType;
        this.currentCoords = [currentLng, currentLat];
        this.nextCoords = [nextLng, nextLat];
    }
}