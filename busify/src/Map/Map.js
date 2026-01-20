import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';
import React, {createRef, useCallback, useEffect, useRef, useState} from "react";
import './Marker/Marker.css';
import Spinner from 'react-bootstrap/Spinner';
import Undemibusu from "./Undemibusu.js";
import {useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import UndemibusuToast from "./UndemibusuToast.js";
import '../Orare/Traseu.css'
import {io} from 'socket.io-client'
import Search from "./Search.js";
import BottomBar from "../OtherComponents/BottomBar";
import VehicleHighlight from "../OtherComponents/VehicleHighlight";
import ReactDOM, {createRoot} from 'react-dom/client';
import Badges from "../OtherComponents/Badges";
import VehicleMarkerWrapper from "../OtherComponents/VehicleMarkerWrapper";
import ClusterMarker from "../OtherComponents/ClusterMarker";
import debounce from 'lodash.debounce';
import NotificationToast from "./NotificationToast";
import InStationToast from "../OtherComponents/InStationToast";
import {useActivate} from "react-activation";
import PaywallSheet from "../Paywall/PaywallSheet";
import { LiaPiggyBankSolid } from "react-icons/lia";
import Supercluster from 'supercluster';

function Map() {
    var map = useRef();
    var defLng = 23.591423;
    var defLat = 46.770439;
    var lastCoords = useRef([defLng, defLat]);
    var lastZoom = useRef(13)
    // OPTIMIZATION: Use Map for O(1) lookups by vehicle label
    // Note: Using window.Map because component is named "Map" which shadows the built-in
    var markers = useRef(new window.Map());
    // OPTIMIZATION: Track visible markers in a Set for fast visibility checks
    var visibleMarkers = useRef(new window.Set());
    const [markersState, setMarkersState ] = useState([]);

    // Cluster management refs
    const clusterIndexes = useRef({
        N: null, // North-bound vehicles
        S: null, // South-bound vehicles
        E: null, // East-bound vehicles
        W: null  // West-bound vehicles
    });
    const clusterMarkers = useRef(new window.Map()); // Map of cluster ID -> {marker, root}
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

    const location = useLocation();

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

    const [showDonationPopup, setShowDonationPopup] = useState(false);

    // In-station toast state
    const allStopsRef = useRef([]);
    const allStopTimesRef = useRef([]);
    const [nearbyStop, setNearbyStop] = useState(null);
    const dismissedStopsRef = useRef(new Set());
    const filteredStopRef = useRef(null); // Track the stop being filtered for live updates

    const nav = useNavigate();

    // OPTIMIZATION: Cache localStorage values to avoid repeated reads
    const localStorageCache = useRef({
        linii_selectate: null,
        iconite: null,
        sageti: null
    });

    const getLocalStorageCached = (key) => {
        if (localStorageCache.current[key] === null) {
            localStorageCache.current[key] = localStorage.getItem(key);
        }
        return localStorageCache.current[key];
    };

    const setLocalStorageCached = (key, value) => {
        localStorage.setItem(key, value);
        localStorageCache.current[key] = value;
    };

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

    // Calculate bearing between two points (for clustering)
    function getBearing(lat1, lon1, lat2, lon2) {
        const toRad = deg => deg * Math.PI / 180;
        const toDeg = rad => rad * 180 / Math.PI;

        const dLon = toRad(lon2 - lon1);
        const y = Math.sin(dLon) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
        const bearing = toDeg(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    // Get cardinal direction from bearing
    function getCardinalDirection(bearing) {
        // Divide compass into 4 quadrants:
        // N: 315-45, E: 45-135, S: 135-225, W: 225-315
        if (bearing >= 315 || bearing < 45) return 'N';
        if (bearing >= 45 && bearing < 135) return 'E';
        if (bearing >= 135 && bearing < 225) return 'S';
        return 'W';
    }

    // Calculate bearing for a vehicle based on current and next coords
    function getVehicleBearing(vehicle) {
        if (vehicle.currentCoords && vehicle.nextCoords &&
            vehicle.currentCoords[0] !== undefined && vehicle.nextCoords[0] !== undefined) {
            return getBearing(
                vehicle.currentCoords[1], vehicle.currentCoords[0],
                vehicle.nextCoords[1], vehicle.nextCoords[0]
            );
        }
        return null;
    }

    // Initialize supercluster indexes for each cardinal direction
    function initializeClusterIndexes() {
        ['N', 'S', 'E', 'W'].forEach(dir => {
            clusterIndexes.current[dir] = new Supercluster({
                radius: 50,     // Cluster radius in pixels
                maxZoom: 17,     // Max zoom to cluster at
                minZoom: 0,
                minPoints: 2     // Minimum points to form a cluster
            });
        });
    }

    // Update cluster indexes with current vehicles
    function updateClusterData(vehicleList) {
        // Group vehicles by cardinal direction
        const vehiclesByDirection = { N: [], S: [], E: [], W: [] };

        vehicleList.forEach(vehicle => {
            let bearing = getVehicleBearing(vehicle);
            let direction;

            if (bearing !== null) {
                direction = getCardinalDirection(bearing);
            } else {
                // Fallback: assign to N if no bearing data available
                bearing = 0;
                direction = 'N';
            }

            vehiclesByDirection[direction].push({
                type: 'Feature',
                properties: {
                    ...vehicle,
                    bearing: bearing,
                    direction: direction
                },
                geometry: {
                    type: 'Point',
                    coordinates: vehicle.lngLat
                }
            });
        });

        // Load data into each direction's cluster index
        ['N', 'S', 'E', 'W'].forEach(dir => {
            if (clusterIndexes.current[dir]) {
                clusterIndexes.current[dir].load(vehiclesByDirection[dir]);
            }
        });

        // Mark that cluster data has been loaded
        clusterDataLoaded.current = true;
    }

    // Track if cluster data has been loaded
    const clusterDataLoaded = useRef(false);

    // Get clusters for current map view
    function getClusters() {
        if (!map.current || !clusterDataLoaded.current) return [];

        const bounds = map.current.getBounds();
        const zoom = Math.floor(map.current.getZoom());
        const bbox = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth()
        ];

        const allClusters = [];

        ['N', 'S', 'E', 'W'].forEach(dir => {
            if (clusterIndexes.current[dir]) {
                try {
                    const clusters = clusterIndexes.current[dir].getClusters(bbox, zoom);
                    clusters.forEach(cluster => {
                        cluster.properties.direction = dir;
                    });
                    allClusters.push(...clusters);
                } catch (e) {
                    // Index not ready yet, skip
                }
            }
        });

        return allClusters;
    }

    // Get vehicles within a cluster
    function getClusterVehicles(clusterId, direction) {
        if (!clusterIndexes.current[direction]) return [];

        const leaves = clusterIndexes.current[direction].getLeaves(clusterId, Infinity);
        return leaves.map(leaf => leaf.properties);
    }

    // Calculate average bearing for a list of vehicles
    function getAverageBearing(vehicles) {
        if (!vehicles.length) return 0;

        let sumX = 0;
        let sumY = 0;

        vehicles.forEach(v => {
            if (v.bearing !== undefined) {
                const rad = v.bearing * Math.PI / 180;
                sumX += Math.cos(rad);
                sumY += Math.sin(rad);
            }
        });

        if (sumX === 0 && sumY === 0) return 0;

        const avgRad = Math.atan2(sumY, sumX);
        return ((avgRad * 180 / Math.PI) + 360) % 360;
    }

    // Calculate offset position for cluster based on average bearing
    function getClusterOffsetPosition(coords, vehicles) {
        const avgBearing = getAverageBearing(vehicles);
        const avgBearingRad = avgBearing * Math.PI / 180;

        // Create a "next point" in the direction of average bearing for offsetToRight
        const distance = 0.001; // Small distance to create direction vector
        const nextCoords = [
            coords[0] + distance * Math.sin(avgBearingRad),
            coords[1] + distance * Math.cos(avgBearingRad)
        ];

        return offsetToRight(coords, nextCoords);
    }

    // Generate a stable cluster ID based on the vehicle labels it contains
    // This ensures the same group of vehicles always maps to the same cluster ID
    function getStableClusterId(clusterVehicles, direction) {
        const labels = clusterVehicles.map(v => v.label).sort().join(',');
        return `cluster-${direction}-${labels}`;
    }

    function renderClusters() {
        if (!map.current || selectedVehicleRef.current) return;

        const clusters = getClusters();
        const currentClusterIds = new window.Set();
        const vehicleLabelsInClusters = new window.Set();

        clusters.forEach(cluster => {
            const coords = cluster.geometry.coordinates;
            const isCluster = cluster.properties.cluster;

            if (isCluster) {
                // This is a cluster - render ClusterMarker
                const clusterVehicles = getClusterVehicles(cluster.id, cluster.properties.direction);

                // Track which vehicle labels are in clusters
                clusterVehicles.forEach(v => vehicleLabelsInClusters.add(v.label));

                // Calculate offset position based on average bearing
                const offsetCoords = getClusterOffsetPosition(coords, clusterVehicles);

                // Use stable ID based on vehicle labels, not Supercluster's internal ID
                const stableClusterId = getStableClusterId(clusterVehicles, cluster.properties.direction);
                currentClusterIds.add(stableClusterId);

                // Check if this cluster already exists
                if (clusterMarkers.current.has(stableClusterId)) {
                    const existingEntry = clusterMarkers.current.get(stableClusterId);

                    // Check if position actually changed
                    const oldLngLat = existingEntry.marker.getLngLat();
                    const positionChanged = Math.abs(oldLngLat.lng - offsetCoords[0]) > 0.00001 ||
                                            Math.abs(oldLngLat.lat - offsetCoords[1]) > 0.00001;

                    if (positionChanged) {
                        const el = existingEntry.marker.getElement();
                        // Skip animation if map is being moved to prevent clusters from
                        // animating from wrong screen positions
                        if (!isMapMoving.current) {
                            el.classList.add('marker-animating');
                            existingEntry.marker.setLngLat(offsetCoords);
                            setTimeout(() => el.classList.remove('marker-animating'), 850);
                        } else {
                            // Update position instantly without animation
                            existingEntry.marker.setLngLat(offsetCoords);
                        }
                    }

                    // Update the stored Supercluster ID for click handler
                    existingEntry.superclusterId = cluster.id;

                    // Re-render the React component with updated vehicles
                    existingEntry.root.render(
                        <ClusterMarker
                            vehicles={clusterVehicles}
                            direction={cluster.properties.direction}
                            mapBearing={map.current.getBearing()}
                            iconite={localStorage.getItem("iconite")}
                            sageti={localStorage.getItem("sageti")}
                        />
                    );
                    return;
                }

                // Create new cluster marker
                const el = document.createElement('div');
                el.className = 'marker cluster-marker-el';
                const root = ReactDOM.createRoot(el);

                root.render(
                    <ClusterMarker
                        vehicles={clusterVehicles}
                        direction={cluster.properties.direction}
                        mapBearing={map.current.getBearing()}
                        iconite={localStorage.getItem("iconite")}
                        sageti={localStorage.getItem("sageti")}
                    />
                );

                const mapboxMarker = new mapboxgl.Marker(el)
                    .setLngLat(offsetCoords)
                    .addTo(map.current);

                // Store info for click handler
                const clusterDirection = cluster.properties.direction;

                // Click handler to zoom into cluster
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Use the stored (potentially updated) Supercluster ID
                    const entry = clusterMarkers.current.get(stableClusterId);
                    const currentSuperclusterId = entry?.superclusterId ?? cluster.id;

                    try {
                        const expansionZoom = clusterIndexes.current[clusterDirection]
                            .getClusterExpansionZoom(currentSuperclusterId);
                        map.current.easeTo({
                            center: coords,
                            zoom: Math.min(expansionZoom + 1, 18),
                            duration: 500
                        });
                    } catch (err) {
                        // Fallback: just zoom in a bit
                        map.current.easeTo({
                            center: coords,
                            zoom: map.current.getZoom() + 2,
                            duration: 500
                        });
                    }
                });

                clusterMarkers.current.set(stableClusterId, {
                    marker: mapboxMarker,
                    root,
                    isCluster: true,
                    superclusterId: cluster.id,
                    direction: cluster.properties.direction
                });
            }
            // Single points are handled by the regular marker system
        });

        // Remove old cluster markers that are no longer needed
        clusterMarkers.current.forEach((value, key) => {
            if (!currentClusterIds.has(key) && value.isCluster) {
                value.marker.remove();
                clusterMarkers.current.delete(key);
            }
        });

        // Update individual marker visibility based on cluster membership
        markers.current.forEach((entry, label) => {
            const el = entry.marker.getElement();
            const shouldBeInCluster = vehicleLabelsInClusters.has(label);

            if (shouldBeInCluster && !entry.inCluster) {
                // Hide marker - it's now part of a cluster
                entry.inCluster = true;
                el.classList.add('marker-in-cluster');
                if (entry.reactRef?.current?.updateVehicle) {
                    entry.reactRef.current.updateVehicle({
                        ...entry.vehicle,
                        hidden: true
                    });
                }
            } else if (!shouldBeInCluster && entry.inCluster) {
                // Show marker - it's no longer part of a cluster
                entry.inCluster = false;
                el.classList.remove('marker-in-cluster');
                if (entry.reactRef?.current?.updateVehicle) {
                    entry.reactRef.current.updateVehicle({
                        ...entry.vehicle,
                        hidden: hiddenMarkerCondition(entry.vehicle)
                    });
                }
            }
        });
    }

    // Clear all cluster markers
    function clearClusterMarkers() {
        clusterMarkers.current.forEach((value, key) => {
            if (value.isCluster) {
                value.marker.remove();
            }
        });
        clusterMarkers.current.clear();
    }

    // Debounced cluster update
    const debouncedRenderClusters = debounce(() => {
        renderClusters();
    }, 150);

    // Check if a vehicle is part of a cluster
    function isVehicleInCluster(vehicle) {
        if (!map.current || selectedVehicleRef.current || !clusterDataLoaded.current) return false;

        const bearing = getVehicleBearing(vehicle);
        if (bearing === null) return false;

        const direction = getCardinalDirection(bearing);
        const clusterIndex = clusterIndexes.current[direction];
        if (!clusterIndex) return false;

        try {
            const zoom = Math.floor(map.current.getZoom());
            const bounds = map.current.getBounds();
            const bbox = [
                bounds.getWest(),
                bounds.getSouth(),
                bounds.getEast(),
                bounds.getNorth()
            ];

            const clusters = clusterIndex.getClusters(bbox, zoom);

            for (const cluster of clusters) {
                if (cluster.properties.cluster) {
                    const leaves = clusterIndex.getLeaves(cluster.id, Infinity);
                    const vehicleInCluster = leaves.some(leaf => leaf.properties.label === vehicle.label);
                    if (vehicleInCluster) return true;
                }
            }
        } catch (e) {
            // Cluster index not ready yet
            return false;
        }

        return false;
    }

    const addMarker = (vehicle) => {
        // OPTIMIZATION: O(1) lookup with Map instead of O(n) findIndex
        const existing = markers.current.get(vehicle.label);
        if (existing) {
            existing.marker.remove();
            markers.current.delete(vehicle.label);
        }

        const el = document.createElement('div');
        const root = ReactDOM.createRoot(el);

        const markerComponentRef = createRef();

        // Check if vehicle should be hidden because it's in a cluster
        const inCluster = isVehicleInCluster(vehicle);

        root.render(
            <VehicleMarkerWrapper
                ref={markerComponentRef}
                initialVehicle={{
                    ...vehicle,
                    hidden: hiddenMarkerCondition(vehicle) || inCluster
                }}
                mapBearing={map.current.getBearing()}
            />
        );

        el.className = "marker";

        // Hide marker element if it's part of a cluster
        if (inCluster) {
            el.classList.add('marker-in-cluster');
        }

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

            // Clear cluster markers when selecting a vehicle
            clearClusterMarkers();

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

        // OPTIMIZATION: O(1) insertion with Map instead of O(n) push
        markers.current.set(vehicle.label, {
            marker: mapboxMarker,
            vehicle,
            reactRef: markerComponentRef,
            inCluster: inCluster
        });

        // Initialize visibility tracking - assume visible until checkMarkerVisibility runs
        visibleMarkers.current.add(vehicle.label);
    };

    // Track if map is currently being moved/dragged
    const isMapMoving = useRef(false);

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

        // If a stop filter is active, re-run the filter with updated vehicle positions
        if (filteredStopRef.current && allStopTimesRef.current.length > 0) {
            foundLabelsRef.current = filterVehiclesByStop(filteredStopRef.current);
        }

        const currentVehicles = vehicles.current;
        // OPTIMIZATION: Use Set for O(1) lookups instead of Array.includes()
        // Note: Using window.Set/Map because component is named "Map" which shadows the built-in
        const currentVehicleLabelsSet = new window.Set(currentVehicles.map(v => v.label));
        // OPTIMIZATION: Create a Map for O(1) vehicle lookups by label
        const currentVehiclesMap = new window.Map(currentVehicles.map(v => [v.label, v]));

        // OPTIMIZATION: Remove markers for vehicles that no longer exist using Map
        const labelsToRemove = [];
        markers.current.forEach((entry, label) => {
            if (!currentVehicleLabelsSet.has(label)) {
                entry.marker.remove();
                labelsToRemove.push(label);
            }
        });
        labelsToRemove.forEach(label => markers.current.delete(label));

        // OPTIMIZATION: Find new vehicles using Set for O(1) checks
        const newVehicles = currentVehicles.filter(v => !markers.current.has(v.label));
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

            // OPTIMIZATION: Build priority lists without sorting - O(n) instead of O(n log n)
            const priorityEntries = [];
            const visibleEntries = [];
            const hiddenEntries = [];

            markers.current.forEach((entry, label) => {
                if (label === selectedLabel) {
                    priorityEntries.push(entry);
                } else if (visibleMarkers.current.has(label)) {
                    visibleEntries.push(entry);
                } else {
                    hiddenEntries.push(entry);
                }
            });

            // Concatenate in priority order without sorting
            const entries = [...priorityEntries, ...visibleEntries, ...hiddenEntries];

            let index = 0;

            const processNextBatch = () => {
                if (token.cancelled) return;
                const batch = entries.slice(index, index + BATCH_SIZE);

                batch.forEach(entry => {
                    // OPTIMIZATION: O(1) lookup with Map instead of O(n) find
                    const vehi = currentVehiclesMap.get(entry.vehicle.label);
                    if (!vehi) return;

                    const end = (vehi.nextCoords && vehi.nextCoords[0] !== undefined)
                        ? offsetToRight(vehi.lngLat, vehi.nextCoords)
                        : vehi.lngLat;

                    // Check if position actually changed (threshold to avoid micro-movements)
                    const oldLngLat = entry.marker.getLngLat();
                    const positionChanged = Math.abs(oldLngLat.lng - end[0]) > 0.00001 ||
                                            Math.abs(oldLngLat.lat - end[1]) > 0.00001;

                    const el = entry.marker.getElement();

                    if (positionChanged) {
                        // Skip animation if map is being moved to prevent markers from
                        // animating from wrong screen positions
                        if (!isMapMoving.current) {
                            el.classList.add('marker-animating');
                            entry.marker.setLngLat(end);
                            setTimeout(() => el.classList.remove('marker-animating'), 850);
                        } else {
                            // Update position instantly without animation
                            entry.marker.setLngLat(end);
                        }
                    }

                    entry.vehicle.lngLat = vehi.lngLat;

                    if (entry.reactRef?.current?.updateVehicle) {
                        entry.reactRef.current.updateVehicle({ ...vehi, hidden: hiddenMarkerCondition(vehi) });
                    }

                    entry.vehicle = { ...vehi };
                });

                index += BATCH_SIZE;
                if (index < entries.length) setTimeout(processNextBatch, 50);
                else if (!token.cancelled) {
                    updateSelectedVehicleAndStops();
                    // Update clusters after all markers have been updated
                    if (!selectedVehicleRef.current) {
                        // Only include visible vehicles in clustering (exclude hidden lines and filtered vehicles)
                        const visibleVehicles = vehicles.current.filter(vehicle => {
                            // If foundLabelsRef has entries, only include vehicles in that list
                            if (foundLabelsRef.current.length > 0) {
                                return foundLabelsRef.current.includes(vehicle.label);
                            }
                            // Otherwise, check line visibility
                            const lineEntry = unique.current.find(elem => elem[0] === vehicle.line);
                            return lineEntry && lineEntry[1] === true;
                        });
                        updateClusterData(visibleVehicles);
                        debouncedRenderClusters();
                    }
                }
            };

            processNextBatch();
        };

        addNextBatch();
    };


    const updateSelectedVehicleAndStops = () => {
        if (selectedVehicleRef.current) {
            // OPTIMIZATION: O(1) lookup with Map.get() instead of O(n) find()
            const entry = markers.current.get(selectedVehicleRef.current.vehicle.label);
            const updatedVehicle = entry?.vehicle;

            if (updatedVehicle) {
                selectedVehicleRef.current.vehicle = updatedVehicle;
                setSelectedVehicle(prev => ({
                    ...prev,
                    vehicle: { ...updatedVehicle }
                }));
                addPolyline(updatedVehicle, false);

                getStops(selectedVehicleRef.current.vehicle.tripId);
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

        // Clear cluster markers first
        clearClusterMarkers();

        // Step 1: Remove existing markers in chunks using Map
        const toRemove = Array.from(markers.current.values());
        markers.current.clear(); // OPTIMIZATION: Use Map.clear() instead of reassignment
        visibleMarkers.current.clear(); // Clear visibility tracking

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

            // Only include visible vehicles in clustering (exclude hidden lines and filtered vehicles)
            const visibleVehicles = eligibleVehicles.filter(vehicle => {
                // If foundLabelsRef has entries, only include vehicles in that list
                if (foundLabelsRef.current.length > 0) {
                    return foundLabelsRef.current.includes(vehicle.label);
                }
                // Otherwise, check line visibility
                const lineEntry = unique.current.find(elem => elem[0] === vehicle.line);
                return lineEntry && lineEntry[1] === true;
            });

            // Update cluster data with visible vehicles only
            updateClusterData(visibleVehicles);

            let addIndex = 0;

            const addNextBatch = () => {
                const batch = eligibleVehicles.slice(addIndex, addIndex + BATCH_SIZE);
                batch.forEach(elem => addMarker(elem));

                addIndex += BATCH_SIZE;
                if (addIndex < eligibleVehicles.length) {
                    setTimeout(addNextBatch, 200);
                } else {
                    // Render clusters after all markers are added
                    if (!selectedVehicleRef.current) {
                        debouncedRenderClusters();
                    }
                }
                checkMarkerVisibility()
            };

            addNextBatch();
        };

        removeNextBatch();
        setMarkersState(Array.from(markers.current.values()));
    };

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

    function addDonationButton() {
        class settingsButton {
            onAdd(map) {
                const div = document.createElement("div");
                div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
                const btn = document.createElement("button");
                div.appendChild(btn);
                const root = createRoot(btn);
                root.render(
                    <LiaPiggyBankSolid
                        style={{scale: "1.7", filter: "brightness(0) saturate(100%) invert(56%) sepia(80%) saturate(873%) hue-rotate(167deg) brightness(90%) contrast(93%)"}}
                    />
                );
                div.addEventListener("contextmenu", (e) => e.preventDefault());
                div.addEventListener("click", () => setShowDonationPopup(prev => !prev));

                return div;
            }
        }
        const button = new settingsButton();
        map.current.addControl(button, "top-right");
    }

    // Ref to store prefetched buses data
    const prefetchedBusesRef = useRef(null);

    const generateMap = async (refresh = false) => {
        try {
            // Parallelize: fetch Mapbox config and buses_basic.json simultaneously
            const [mapboxData, busesBasic] = await Promise.all([
                fetch('https://busifyserver.onrender.com/mapbox').then(r => r.json()),
                fetch('https://orare.busify.ro/public/buses_basic.json').then(r => r.json()).catch(() => null)
            ]);

            // Store buses data for later use in socketData
            prefetchedBusesRef.current = busesBasic;

            mapboxgl.accessToken = mapboxData.accessToken;
            map.current = new mapboxgl.Map({
                container: 'map',
                center: [defLng, defLat],
                style: mapboxData.style,
                zoom: 13,
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
            if(!localStorage.hasOwnProperty("active_subscription")) {
                addDonationButton();
            }
            map.current.on('load', () => {
                // Initialize cluster indexes
                initializeClusterIndexes();

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
                                // zoom: 13,
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

            // Track map movement state to prevent marker animation glitches
            map.current.on('movestart', () => {
                isMapMoving.current = true;
            });
            map.current.on('moveend', () => {
                isMapMoving.current = false;
            });

            map.current.on('rotate', () => {
                const mapBearing = map.current.getBearing() * Math.PI / 180; // convert to radians

                // Update individual marker arrows
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

                // Update cluster marker arrows
                clusterMarkers.current.forEach(({ marker, isCluster }) => {
                    if (!isCluster) return;
                    const el = marker.getElement();
                    const arrowEl = el.querySelector('.cluster-arrow');

                    if (arrowEl) {
                        const originalBearing = parseFloat(arrowEl.dataset.bearing) || 0;
                        const originalDx = parseFloat(arrowEl.dataset.dx) || 0;
                        const originalDy = parseFloat(arrowEl.dataset.dy) || 0;

                        const newBearing = originalBearing - (map.current.getBearing());

                        const cosB = Math.cos(-mapBearing);
                        const sinB = Math.sin(-mapBearing);

                        const rotatedDx = originalDx * cosB - originalDy * sinB;
                        const rotatedDy = originalDx * sinB + originalDy * cosB;

                        arrowEl.style.transform = `rotate(${newBearing}deg)`;
                        arrowEl.style.left = `calc(50% + ${rotatedDx}px - 20.5px)`;
                        arrowEl.style.top = `calc(50% + ${rotatedDy}px - 20.5px)`;
                    }
                });
            });
            // Debounced version for smooth updates without over-triggering

            // Attach the listener (usually inside useEffect)

            const debouncedCheckMarkerVisibility = debounce(checkMarkerVisibility, 200);
            map.current.on('moveend', debouncedCheckMarkerVisibility);

            // Update clusters on zoom changes
            map.current.on('zoomend', () => {
                if (!selectedVehicleRef.current) {
                    updateMarkerClusterVisibility();
                    debouncedRenderClusters();
                }
            });

            // Also update clusters on move (for panning)
            map.current.on('moveend', () => {
                if (!selectedVehicleRef.current) {
                    debouncedRenderClusters();
                }
            });
        } catch {
        }
    }

    // Update which individual markers are visible vs hidden in clusters
    function updateMarkerClusterVisibility() {
        markers.current.forEach((entry, label) => {
            const el = entry.marker.getElement();
            const wasInCluster = entry.inCluster;
            const nowInCluster = isVehicleInCluster(entry.vehicle);

            if (wasInCluster !== nowInCluster) {
                entry.inCluster = nowInCluster;

                if (nowInCluster) {
                    el.classList.add('marker-in-cluster');
                    if (entry.reactRef?.current?.updateVehicle) {
                        entry.reactRef.current.updateVehicle({
                            ...entry.vehicle,
                            hidden: true
                        });
                    }
                } else {
                    el.classList.remove('marker-in-cluster');
                    if (entry.reactRef?.current?.updateVehicle) {
                        entry.reactRef.current.updateVehicle({
                            ...entry.vehicle,
                            hidden: hiddenMarkerCondition(entry.vehicle)
                        });
                    }
                }
            }
        });
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

        // OPTIMIZATION: Convert Map values to array for batch processing
        const entries = Array.from(markers.current.values());
        const BATCH_SIZE = 25;
        let index = 0;

        const processNextBatch = () => {
            const batch = entries.slice(index, index + BATCH_SIZE);

            batch.forEach(({ vehicle, marker }) => {
                const el = marker.getElement();
                const inBounds = paddedBounds.contains(vehicle.lngLat);
                const isCurrentlyVisible = visibleMarkers.current.has(vehicle.label);

                if (inBounds && !isCurrentlyVisible) {
                    // OPTIMIZATION: Use CSS class instead of inline style
                    visibleMarkers.current.add(vehicle.label);
                    el.classList.remove('marker-hidden');
                } else if (!inBounds && isCurrentlyVisible) {
                    visibleMarkers.current.delete(vehicle.label);
                    el.classList.add('marker-hidden');
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
                        // map.current.fitBounds(bounds, {
                        //     padding: padding,
                        //     duration: 1250,
                        //     maxZoom: 14
                        // })

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
        // Invalidate cache and read fresh value from localStorage
        // (settings page may have changed linii_selectate)
        localStorageCache.current.linii_selectate = null;
        const cachedLinii = getLocalStorageCached('linii_selectate');
        if (cachedLinii) s = cachedLinii.split(',');
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
            // OPTIMIZATION: Use cached localStorage value
            const cachedLinii = getLocalStorageCached('linii_selectate');
            if (cachedLinii)
                s = cachedLinii.split(',');

            // Use prefetched buses data instead of fetching again
            const buses_basic = prefetchedBusesRef.current;
            if (buses_basic) {
                const joinArray = (arr) => {
                    arr.forEach(elem => unique.current.push([elem.name, true]));
                };
                joinArray(buses_basic.urbane);
                joinArray(buses_basic.metropolitane);
                joinArray(buses_basic.market);
                joinArray(buses_basic.noapte);
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

            // OPTIMIZATION: Use cached localStorage access
            if (!getLocalStorageCached('linii_selectate'))
                setLocalStorageCached('linii_selectate', unique.current);
            if (!getLocalStorageCached('iconite'))
                setLocalStorageCached('iconite', true);
            if (!getLocalStorageCached('sageti'))
                setLocalStorageCached('sageti', true);

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
                // OPTIMIZATION: O(1) lookup with Map.get() instead of O(n) find()
                const elem = markers.current.get(searchParams.get('id'));
                if (!elem) return; // Guard against missing marker
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

    useActivate(() => {
        if(map.current) {
            map.current.resize();
            if(sessionStorage.getItem("navigation_last_page") === "/setari") {
                setShownVehicles()
                resetMarkers()
            }
        }
    })

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
                        // zoom: 13,
                        essential: true
                    });
                    lastCoords.current = selectedVehicleRef.current.vehicle.lngLat;
                    // lastZoom.current = 13
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
            if(map.current) {
                map.current.resize();
            }
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
        if (localStorage.hasOwnProperty("active_subscription")) {
            return;
        }

        const setNextDate = (days) => {
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + days);
            localStorage.setItem("donation_popup_next_date", nextDate.toISOString());
        }

        if (!localStorage.hasOwnProperty("donation_popup_next_date")) {
            // First time user: set reminder for 3 days from now
            setNextDate(3);
        } else if (new Date() > new Date(localStorage.getItem("donation_popup_next_date"))) {
            // Time has passed, show the popup and schedule next one in 30 days
            setShowDonationPopup(true);
            setNextDate(30);
        }
    }

    const mapOptimizationUpdateNotification = () => {
        if(!localStorage.hasOwnProperty("map_optimization_update_notifiation")){
            setNotificationTitle("Începem lucrul la optimizări semnificative ale hărții! Modificările vor fi vizibile o perioadă doar celor cu abonament activ.")
            setShowNotification(true)
            localStorage.setItem("map_optimization_update_notifiation", "true")
        }
    }

    useEffect(() => {
        if (loaded && map.current) {
            map.current.resize();
            resetMarkers();
        }
    }, [loaded]);

    useEffect(() => {
        if (map.current) return;

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
        };
    }, []);

    // Fetch all stops and stop times for in-station detection
    useEffect(() => {
        const fetchAllStops = async () => {
            try {
                const [stopsRes, stopTimesRes] = await Promise.all([
                    fetch('https://busifyserver.onrender.com/stops'),
                    fetch('https://busifyserver.onrender.com/stoptimes')
                ]);
                allStopsRef.current = await stopsRes.json();
                allStopTimesRef.current = await stopTimesRes.json();
            } catch (e) {
                console.error('Error fetching stops for in-station detection:', e);
            }
        };
        fetchAllStops();
    }, []);

    // In-station proximity detection - check every 3 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!map.current?._controls?.[2]?._lastKnownPosition) return;
            if (allStopsRef.current.length === 0) return;

            const userLat = map.current._controls[2]._lastKnownPosition.coords.latitude;
            const userLng = map.current._controls[2]._lastKnownPosition.coords.longitude;

            // Find nearest stop within 10m (0.01km)
            let nearestStop = null;
            let minDistance = Infinity;

            allStopsRef.current.forEach(stop => {
                const dist = Math.abs(calculateDistance(userLat, userLng, stop.stop_lat, stop.stop_lon));
                if (dist < 0.01 && dist < minDistance && !dismissedStopsRef.current.has(stop.stop_id)) {
                    minDistance = dist;
                    nearestStop = stop;
                }
            });

            if (nearestStop && nearbyStop?.stop_id !== nearestStop.stop_id) {
                setNearbyStop(nearestStop);
            } else if (!nearestStop && nearbyStop) {
                // User left the stop area - clear the toast but don't add to dismissed
                setNearbyStop(null);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [nearbyStop]);

    // Filter vehicles that will pass through a specific stop
    const filterVehiclesByStop = (stop) => {
        // Get all trip_ids that pass through this stop, with their stop_sequence
        // Trip IDs have format: {route_id}_0 or {route_id}_1 where suffix indicates direction
        // Use == for comparison to handle potential string/number type mismatch
        const tripsWithStop = allStopTimesRef.current
            .filter(st => st.stop_id == stop.stop_id)
            .map(st => ({ tripId: st.trip_id, stopSequence: st.stop_sequence }));

        // Create a Set of valid trip IDs for O(1) lookup
        const validTripIds = new Set(tripsWithStop.map(t => t.tripId));

        const matchingLabels = [];

        vehicles.current.forEach(vehicle => {
            // The vehicle's tripId must exactly match one of the valid trip IDs for this stop
            // This ensures direction matching: if stop is on route_0, vehicles on route_1 won't match
            if (!validTripIds.has(vehicle.tripId)) return;

            // Find the stop sequence for this specific trip
            const tripMatch = tripsWithStop.find(t => t.tripId === vehicle.tripId);
            if (!tripMatch) return;

            // Get the stop sequence where the user is waiting
            const userStopSequence = tripMatch.stopSequence;

            // Get all stops for this vehicle's trip, sorted by sequence
            const vehicleStopsInTrip = allStopTimesRef.current
                .filter(st => st.trip_id === vehicle.tripId)
                .sort((a, b) => a.stop_sequence - b.stop_sequence);

            if (vehicleStopsInTrip.length === 0) return;

            // Find the closest stop to the vehicle to determine its position on the route
            let closestStops = [];
            for (const st of vehicleStopsInTrip) {
                const stopData = allStopsRef.current.find(s => s.stop_id == st.stop_id);
                if (!stopData) continue;
                const dist = Math.abs(calculateDistance(
                    vehicle.lngLat[1], vehicle.lngLat[0],
                    stopData.stop_lat, stopData.stop_lon
                ));
                closestStops.push({ ...st, dist, stopData });
            }
            closestStops.sort((a, b) => a.dist - b.dist);

            if (closestStops.length === 0) return;

            const nearestStop = closestStops[0];
            const vehicleStopSequence = nearestStop.stop_sequence;

            // Vehicle will pass through this stop if it hasn't passed it yet (include vehicles currently at the stop)
            if (vehicleStopSequence <= userStopSequence) {
                matchingLabels.push(vehicle.label);
            }
        });

        return matchingLabels;
    };

    return (
        <div className='body'>
            <Badges/>
            <div id='map' className="map-container" style={{ visibility: loaded ? 'visible' : 'hidden' }} />
            <Spinner animation="grow" variant='dark' className='spinner-container' style={{ visibility: !loaded ? 'visible' : 'hidden' }} />
            <Search
                show={showSearch}
                unique={unique}
                vehicles={Array.from(markers.current.values()).map(elem => elem.vehicle)}
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
            <InStationToast
                nearbyStop={nearbyStop}
                onFilter={(stop) => {
                    foundLabelsRef.current = filterVehiclesByStop(stop);
                    // Store the stop for live updates when new vehicle data arrives
                    filteredStopRef.current = stop;
                    // Add to dismissed so toast won't reappear while user is still at the stop
                    dismissedStopsRef.current.add(stop.stop_id);
                    setNearbyStop(null);
                    resetMarkers();
                    setShowUndemibusuToast(true);
                }}
                onDismiss={(stopId) => {
                    dismissedStopsRef.current.add(stopId);
                    setNearbyStop(null);
                }}
            />
            <PaywallSheet
                show={showDonationPopup}
                onHide={() => {
                    setShowDonationPopup(false);
                }}
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
                    filteredStopRef.current = null; // Clear stop filter for live updates
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