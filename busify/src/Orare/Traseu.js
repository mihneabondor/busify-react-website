import './Traseu.css'
import { useParams } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import {
    MDBCol,
    MDBContainer,
    MDBRow,
    MDBTypography,
} from "mdb-react-ui-kit";
import React from 'react';
import Badge from 'react-bootstrap/Badge';
import { useEffect, useState, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import Form from 'react-bootstrap/Form';

function Traseu() {
    const { linie } = useParams();
    const nav = useNavigate();
    const [stops, setStops] = useState([]);
    const stopsRef = useRef([]);

    const turRef = useRef('_0');
    const [turLabel, setTurLabel] = useState('_0');

    const markersRef = useRef([]);

    var map = useRef(null);

    var defLng = 23.591423;
    var defLat = 46.770439;

    const fetchData = async () => {
        try {
            var url = 'https://busifybackend-40a76006141a.herokuapp.com/stops';
            let data = await fetch(url);
            const stops = await data.json();

            url = 'https://busifybackend-40a76006141a.herokuapp.com/stoptimes';
            data = await fetch(url);
            let stopTimes = await data.json();

            url = 'https://busifybackend-40a76006141a.herokuapp.com/routes';
            data = await fetch(url);
            let routes = await data.json();

            const routeId = routes.find(elem => elem.route_short_name === linie).route_id;
            stopTimes = stopTimes.filter(elem => elem.trip_id === routeId + turRef.current);
            stopsRef.current = []
            stopTimes.forEach(element => {
                const stop = stops.find(e => e.stop_id === element.stop_id)
                stopsRef.current.push(stop)
            });
            setStops(stopsRef.current)
            addPolyline(routeId + turRef.current)
            markersRef.current.forEach(elem => elem.remove())
            markersRef.current = []
            stopsRef.current.forEach(e => addMarker(e))
        } catch (e){console.error(e); }
    }

    const addMarker = (stop) => {
        //popup
        var innerHtmlContent = '<br/>' + stop.stop_name;
        const divElement = document.createElement('div');
        divElement.innerHTML = innerHtmlContent;

        var el = document.createElement('div');
        const popup = new mapboxgl.Popup({
            offset: 5
        })
            .setDOMContent(divElement);
        //marker
        el.className = 'traseu-marker';
        // el.innerHTML = '<img width="15px" height="15px" src="">';
        el.innerHTML = '<svg fill="#ffffff" height="15px" width="15px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g transform="translate(0 -1)"> <g> <g> <polygon points="328.533,86.333 328.533,137.533 354.133,137.533 354.133,94.867 354.133,86.333 "></polygon> <polygon points="285.867,94.867 285.867,137.533 311.467,137.533 311.467,86.333 285.867,86.333 "></polygon> </g> </g> </g> <g> <g> <path d="M405.333,25.6H234.667c-5.12,0-8.533,3.413-8.533,8.533v51.2H192V25.6C192,11.093,180.907,0,166.4,0 c-14.507,0-25.6,11.093-25.6,25.6v435.2c-23.893,0-42.667,18.773-42.667,42.667c0,5.12,3.413,8.533,8.533,8.533h119.467 c5.12,0,8.533-3.413,8.533-8.533c0-23.893-18.773-42.667-42.667-42.667V256h34.133v51.2c0,5.12,3.413,8.533,8.533,8.533h170.667 c5.12,0,8.533-3.413,8.533-8.533V34.133C413.867,29.013,410.453,25.6,405.333,25.6z M226.133,238.933H192V102.4h34.133V238.933z M268.8,145.067v-51.2V76.8c0-5.12,3.413-8.533,8.533-8.533h85.333c5.12,0,8.533,3.413,8.533,8.533v17.067v51.2V179.2 c0,5.12-3.413,8.533-8.533,8.533s-8.533-3.413-8.533-8.533v-25.6h-68.267v25.6c0,5.12-3.413,8.533-8.533,8.533 c-5.12,0-8.533-3.413-8.533-8.533V145.067z M362.667,213.333c0,5.12-3.413,8.533-8.533,8.533h-68.267 c-5.12,0-8.533-3.413-8.533-8.533c0-5.12,3.413-8.533,8.533-8.533h68.267C359.253,204.8,362.667,208.213,362.667,213.333z M371.2,264.533H268.8c-5.12,0-8.533-3.413-8.533-8.533s3.413-8.533,8.533-8.533h102.4c5.12,0,8.533,3.413,8.533,8.533 S376.32,264.533,371.2,264.533z"></path> </g> </g> </g></svg>'

        const marker = new mapboxgl.Marker(el)
            .setLngLat([stop.stop_lon, stop.stop_lat])
            .setPopup(popup)
            .addTo(map.current);
        markersRef.current.push(marker)
    };

    const addPolyline = useCallback(async (routeId) => {
        // if (!map.current.getSource('route')) {
            try {
                var url = 'https://busifybackend-40a76006141a.herokuapp.com/shapes?shapeid=' + routeId;

                var response = await fetch(url);
                const shapeData = await response.json();

                const polylineCoordinates = shapeData.map((elem) => [elem.shape_pt_lon, elem.shape_pt_lat])
                let last = polylineCoordinates.length - 1

                if(map.current.getSource('route')) {
                    map.current.removeLayer('route')
                    map.current.removeSource('route')
                }

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

                let bounds = new mapboxgl.LngLatBounds();
                bounds.extend(polylineCoordinates[0]);
                bounds.extend(polylineCoordinates[last]);
                map.current.fitBounds(bounds, {
                    padding: {
                        top: 50,
                        bottom: 50,
                        left: 50,
                        right: 50
                    }, duration: 2000
                })
            } catch (e) { console.log(e) }
        // }
    }, []);

    useEffect(() => {
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
        map.current.addControl(geo);

        fetchData();
    }, [])

    return (
        <div>
            <br />
            <Form.Switch
                id="custom-switch"
                label={turRef.current === '_0' ? 'Tur' : 'Retur'}
                onChange={() => {
                    turRef.current = turRef.current === '_0' ? '_1' : '_0'
                    setTurLabel(turRef.current)
                    fetchData()
                }}
            />
            <div className='traseu-body'>
                <MDBContainer fluid className="py-4 mdb-container">
                    <MDBRow>
                        <MDBCol lg="12">
                            <div className="horizontal-timeline">
                                <MDBTypography listInLine className="items timeline-container">
                                    {stops.map((elem, ind) => (
                                        <li className="items-list">
                                            <div className="px-3">
                                                <Badge pill className='timeline-badge' bg='secondary'>{ind + 1}</Badge>
                                                <p className="pt-2">{elem.stop_name}</p>
                                            </div>
                                        </li>
                                    ))}
                                </MDBTypography>
                            </div>
                        </MDBCol>
                    </MDBRow>
                </MDBContainer>
                <div id='map' className='traseu-map-container' />
            </div>
        </div>
    )
}

export default Traseu