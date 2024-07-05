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
    const [turLabel, setTurlabl] = useState('_0');

    const markersRef = useRef([]);

    var map = useRef(null);

    var defLng = 23.591423;
    var defLat = 46.770439;

    const fetchData = async () => {
        try {
            var url = 'https://busifybackend-40a76006141a.herokuapp.com/stops';
            const options = {
                method: 'GET',
                headers: {
                    'X-Agency-Id': '2',
                    Accept: 'application/json',
                    'X-API-KEY': 'ksRfq3mejazGhBobQYkPrgAUfnFaClVcgTa0eIlJ'
                }
            };
            let data = await fetch(url, options);
            const stops = await data.json();

            url = 'https://busifybackend-40a76006141a.herokuapp.com/stoptimes';
            data = await fetch(url, options);
            let stopTimes = await data.json();

            url = 'https://busifybackend-40a76006141a.herokuapp.com/routes';
            data = await fetch(url, options);
            let routes = await data.json();

            const routeId = routes.find(elem => elem.route_short_name === linie).route_id;
            stopTimes = stopTimes.filter(elem => elem.trip_id === routeId + turRef.current);
            stopsRef.current = []
            stopTimes.forEach(element => {
                const stop = stops.find(e => e.stop_id === element.stop_id)
                stopsRef.current.push(stop)
            });
            console.log(stopsRef.current)
            setStops(stopsRef.current)
            addPolyline(routeId + turRef.current)
            markersRef.current.forEach(elem => elem.remove())
            markersRef.current = []
            stopsRef.current.forEach(e => addMarker(e))
        } catch { }
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
        el.innerHTML = '<img width="15px" height="15px" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACeklEQVR4nO2aP2sUQRjGxyCBoEYUK6OIVToLNSKIqJ2NoCmSgG0+iIXGS5/aziL/tEhSin4Ai6BgkU7MP9GICRESFH/yhgm5zM4ss7M7c3tnHlgO7uZ95/ntzOzMzpyiWm0DS8A08BA4plKJuJoHTnUCiOhlp4CIrqo6C7iFn8ZV3YWf3qkOAVlSdRZw2xPkawozKbTTKSB4+LgIzABb+noN9LcViIbYsIT9kN9USgFngUFgJQBEWsKlqXQUh00NBoBIV3JpM537bMtUCfIznfussaIgMrBdmkznvDxIvx7Ypr4DF9I5zxrLyCNGnlxTMib0NdlSiFCQWor/HQQYBj7JkkbPRw2gO77jikCALmAM+GsJbaRzXgIEOAG8wq21tO4DQIA+4H0OxJ7SExwYzMhS5qbcbVtZU62hiLCiVm0G4hwnrYI4VxBAnlTP9JOrViBP8dcyMNIUa1VRA6eBMyWuK8CEYy7wnRCt8gVIoiMQjlokjixd+jzwAHgCzAGrbTVG9AHQl5DYXJX0J3dyQC/8BvTBjtOMXqb/LljHWmyQOUc+F0wIhP8ynnBdd+S74ShfFGJdz/jHY4NYzwble49YgRr29NcFXKtTixSCAHqBR8AbVzeuCmTekW8hJ+YP8NjD0wsj7kNMkD0Y3QIn9edCRd3pnhH7C+iJCeKrXekmPhBN48J8exxVNQB5m2vC7qth5PiY+0+KRCBDASCX9Jhq1p2WghSF2Bcwa6SaVW0KctdIJS10OTRfXkVRQUTAYvSdR9d5oaHlknWMVpnPVclzD5CxknX0AN+a8n2ujuCgkm4NY2sZ2SGRjenSu+n6BUzqkPeY+7ZC/wDIrCW6x1A+VwAAAABJRU5ErkJggg==">';

        const marker = new mapboxgl.Marker(el)
            .setLngLat([stop.stop_lon, stop.stop_lat])
            .setPopup(popup)
            .addTo(map.current);
        markersRef.current.push(marker)
    };

    const addPolyline = useCallback(async (routeId) => {
        if (!map.current.getSource('route')) {
            try {
                var url = 'https://busifybackend-40a76006141a.herokuapp.com/shapes?shapeid=' + routeId;

                var response = await fetch(url);
                const shapeData = await response.json();

                const polylineCoordinates = shapeData.map((elem) => [elem.shape_pt_lon, elem.shape_pt_lat])
                let last = polylineCoordinates.length - 1
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
            } catch { }
        }
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
                    setTurlabl(turRef.current)
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