import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Button from 'react-bootstrap/esm/Button';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

function DestinatiiToast(props) {
    const [loading, setLoading] = useState(true)
    const [currentStep, setCurrentStep] = useState(null)
    let currentStepRef = useRef();
    let currentIndexRef = useRef(0);

    useEffect(() => {
        if (loading) {
            setLoading(typeof (props.instructions) === 'undefined')
            if (typeof (props.instructions) !== 'undefined')
                drawPolyline([props.instructions.start_location.lng, props.instructions.start_location.lat], [props.instructions.end_location.lng, props.instructions.end_location.lat], 'allRoute', 'destination', '#888')
        }
    }, [props.instructions])

    const drawPolyline = async (startCoords, endCoords, lineName, dotName, lineColor) => {
        try {
            const key = '5b3ce3597851110001cf6248f864c0c225094fa28a808176ea37f43a'
            const start = startCoords[0] + ',' + startCoords[1]
            const end = endCoords[0] + ',' + endCoords[1]
            const url = 'https://api.openrouteservice.org/v2/directions/driving-car?api_key=' + key + '&start=' + start + '&end=' + end
            const resp = await fetch(url)
            const data = await resp.json()
            addPolyline(data.features[0].geometry.coordinates, lineName, dotName, lineColor)
        } catch { }
    }

    const addPolyline = (polylineCoordinates, namePolyline, namePulsingDot, lineColor) => {
        let bounds = new mapboxgl.LngLatBounds();
        bounds.extend(polylineCoordinates[0]);
        bounds.extend(polylineCoordinates[polylineCoordinates.length - 1]);
        props.map.current.fitBounds(bounds, {
            padding: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50
            }, duration: 2000
        })

        props.map.current.addSource(namePolyline, {
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

        props.map.current.addLayer({
            'id': namePolyline,
            'type': 'line',
            'source': namePolyline,
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': lineColor,
                'line-width': 5
            }
        });

        const size = 90;
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
                context.fillStyle = `rgba(29, 161, 242, ${1 - t})`;
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
                context.fillStyle = 'rgba(29, 161, 242)'; // 
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
                props.map.current.triggerRepaint();

                // Return `true` to let the map know that the image was updated.
                return true;
            }
        };

        props.map.current.addImage(namePulsingDot, pulsingDot, { pixelRatio: 2 });

        props.map.current.addSource(namePulsingDot, {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': polylineCoordinates[polylineCoordinates.length - 1]
                        }
                    }
                ]
            }
        });

        props.map.current.addLayer({
            'id': namePulsingDot,
            'type': 'symbol',
            'source': namePulsingDot,
            'layout': {
                'icon-image': namePulsingDot
            }
        });

        props.map.current.addImage(namePulsingDot + '1', pulsingDot, { pixelRatio: 2 });

        props.map.current.addSource(namePulsingDot + '1', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': polylineCoordinates[0]
                        }
                    }
                ]
            }
        });

        props.map.current.addLayer({
            'id': namePulsingDot + '1',
            'type': 'symbol',
            'source': namePulsingDot + '1',
            'layout': {
                'icon-image': namePulsingDot + '1'
            }
        });
    }

    const removePolyline = (layer1, layer2) => {
        let hasSomething = false;
        if (props.map.current.getLayer(layer1)) {
            props.map.current.removeLayer(layer1);
            hasSomething = true
        }
        if (props.map.current.getSource(layer1)) {
            props.map.current.removeSource(layer1);
            hasSomething = true
        }
        if (props.map.current.getLayer(layer2)) {
            props.map.current.removeLayer(layer2);
            hasSomething = true
        }
        if (props.map.current.getSource(layer2)) {
            props.map.current.removeSource(layer2);
            hasSomething = true
        }
        if (props.map.current.getLayer(layer2 + '1')) {
            props.map.current.removeLayer(layer2 + '1');
            hasSomething = true
        }
        if (props.map.current.getSource(layer2 + '1')) {
            props.map.current.removeSource(layer2 + '1');
            hasSomething = true
        }
    };

    useEffect(() => {
        if (document.getElementById('instructionsDiv'))
            document.getElementById('instructionsDiv').innerHTML = currentStepRef.current.html_instructions
    }, [currentStepRef.current])

    const filterLines = () => {
        props.setshownvehicles()
        if (currentStepRef.current && currentStepRef.current.transit_details) {
            props.unique.current.forEach(elem => {
                elem[1] = (elem[0] === currentStepRef.current.transit_details.line.short_name)
            })
        }
        props.setuniquelines(props.unique.current)
        props.resetmarkers()
    }

    if (loading)
        return (<div></div>)

    return (
        <div>
            {currentStep === null ?
                <ToastContainer
                    className="p-3"
                    position={'bottom-center'}
                    style={{ zIndex: 1 }}>
                    <Toast show={props.show}>
                        <Toast.Header closeButton={false}>
                            <strong className="me-auto">Indicatii pas cu pas</strong>
                            <small className="text-muted">{props.instructions.distance.text} in {props.instructions.duration.text}</small>
                        </Toast.Header>
                        <Toast.Body>
                            <p><b>Destinatie:</b> {props.instructions.end_address} </p>
                            <Button onClick={() => {
                                setCurrentStep(props.instructions.steps[0])
                                currentStepRef.current = props.instructions.steps[0]
                                removePolyline('allRoute', 'destination')
                                drawPolyline([currentStepRef.current.start_location.lng, currentStepRef.current.start_location.lat], [currentStepRef.current.end_location.lng, currentStepRef.current.end_location.lat], 'stepLine', 'stepDot', '#888')
                                filterLines()
                            }}>Incepe</Button>
                        </Toast.Body>
                    </Toast>
                </ToastContainer>
                :
                <ToastContainer
                    className="p-3"
                    position={'bottom-center'}
                    style={{ zIndex: 1 }}>
                    <Toast show={props.show}>
                        <Toast.Header closeButton={false}>
                            <strong className="me-auto">{currentIndexRef.current + 1} din {props.instructions.steps.length} pasi</strong>
                            <small className="text-muted">{currentStep.distance.text} in {currentStep.duration.text}</small>
                        </Toast.Header>
                        <Toast.Body>
                            <p id='instructionsDiv' />
                            {currentStepRef.current.transit_details ?
                                <div>
                                    <p><b>Linie: </b> {currentStepRef.current.transit_details.line.short_name} <br />
                                        <b>Statii: </b> {currentStepRef.current.transit_details.num_stops}
                                    </p>
                                </div>
                                : <p />}
                            <div style={{ width: '100%' }}>
                                <Button
                                    onClick={() => {
                                        if (currentIndexRef.current === 0) {
                                            currentStepRef.current = null;
                                            drawPolyline([props.instructions.start_location.lng, props.instructions.start_location.lat], [props.instructions.end_location.lng, props.instructions.end_location.lat], 'allRoute', 'destination', '#888')
                                            document.getElementById('instructionsDiv').innerHTML = ''
                                        }
                                        else {
                                            currentStepRef.current = props.instructions.steps[--currentIndexRef.current]
                                            drawPolyline([currentStepRef.current.start_location.lng, currentStepRef.current.start_location.lat], [currentStepRef.current.end_location.lng, currentStepRef.current.end_location.lat], 'stepLine', 'stepDot', '#888')
                                        }
                                        setCurrentStep(currentStepRef.current)
                                        removePolyline('stepLine', 'stepDot')
                                        filterLines()
                                    }}
                                >Inapoi</Button>
                                <Button style={{
                                    float: 'right',
                                    visibility: currentIndexRef.current + 1 === props.instructions.steps.length ? 'hidden' : 'visible'
                                }}
                                    onClick={() => {
                                        currentStepRef.current = props.instructions.steps[++currentIndexRef.current]
                                        setCurrentStep(currentStepRef.current)
                                        removePolyline('stepLine', 'stepDot')
                                        drawPolyline([currentStepRef.current.start_location.lng, currentStepRef.current.start_location.lat], [currentStepRef.current.end_location.lng, currentStepRef.current.end_location.lat], 'stepLine', 'stepDot', '#888')
                                        filterLines()
                                    }}
                                >Inainte</Button>
                            </div>
                        </Toast.Body>
                    </Toast>
                </ToastContainer>
            }</div>
    )
}

export default DestinatiiToast