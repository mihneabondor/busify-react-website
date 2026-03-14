import '../Orare/Orare.css'
import Form from 'react-bootstrap/Form';
import {useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from "react-router-dom";
import {ReactComponent as BackButton} from "../Images/backButton.svg";
import {ReactComponent as Decoration} from "../Images/DirectionsDecoration.svg";
import {ReactComponent as SwitchIcon} from '../Images/SwitchIcon.svg'
import InputGroup from "react-bootstrap/InputGroup";
import {ReactComponent as LocationIcon} from "../Images/locationIcon.svg";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import Marker from "../OtherComponents/Marker";
import { FaWalking } from "react-icons/fa";
import { MdHistory } from "react-icons/md";

// ─── Constants ───────────────────────────────────────────────────────────────

const HISTORY_KEY = 'busify_route_history';
const MAX_HISTORY = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDuration = (seconds) => {
    const m = Math.round(seconds / 60);
    if (m < 60) return { value: m, unit: 'min' };
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? { value: h, unit: 'h' } : { value: `${h}h ${rem}`, unit: 'min' };
};

const formatTime = (ms) => {
    const d = new Date(ms);
    return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
};

const getTransitLegs = (itinerary) =>
    itinerary.legs.filter(leg => leg.transitLeg);

const buildLegSummary = (itinerary) => {
    const walkLegs = itinerary.legs.filter(l => l.mode === 'WALK');
    const transitLegs = getTransitLegs(itinerary);
    const totalWalkKM = Math.round(walkLegs.reduce((acc, l) => acc + l.distance, 0) / 1000 * 10) / 10;
    const lines = transitLegs.map(l => l.routeShortName).join(', ');
    return `${totalWalkKM} km mers · lini${transitLegs.length > 1 ? 'ile' : 'a'} ${lines}`;
};

const vehicleTypeColors = {
    autobuze:   '905EA8',
    microbuze:  '905EA8',
    troleibuze: '2D8CFF',
    tramvaie:   '0FBE7E',
};

const getRouteColor = (leg) => {
    if (leg.vehicleType && vehicleTypeColors[leg.vehicleType]) {
        return vehicleTypeColors[leg.vehicleType];
    }
    return leg.routeColor;
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const loadHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch {
        return [];
    }
};

// Saves a new search to history, deduplicating by origin+destination
const saveToHistory = (origin, destination) => {
    const existing = loadHistory();
    const entry = { origin, destination, timestamp: Date.now() };
    const deduped = existing.filter(
        e => !(e.origin === origin && e.destination === destination)
    );
    const updated = [entry, ...deduped].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
};

// ─── HistoryCard ──────────────────────────────────────────────────────────────

function HistoryCard({ entry, onSelect }) {
    return (
        <div
            onClick={() => onSelect(entry)}
            style={{
                outline: "solid 1px RGB(208,215,227)",
                borderRadius: '10px',
                width: "100%",
                boxShadow: 'rgba(0, 0, 0, 0.08) 1.95px 1.95px 2.6px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
            }}
        >
            <MdHistory size={18} color="gray" style={{ flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
                <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {entry.origin}
                </div>
                <div style={{
                    fontSize: '0.78rem',
                    color: 'gray',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    → {entry.destination}
                </div>
            </div>
        </div>
    );
}

// ─── ItineraryCard ────────────────────────────────────────────────────────────

function ItineraryCard({ itinerary, onSelect }) {
    const { value, unit } = formatDuration(itinerary.duration);
    const transitLegs = getTransitLegs(itinerary);
    const arrivalTime = formatTime(itinerary.endTime);
    const summary = buildLegSummary(itinerary);

    return (
        <div style={{
            outline: "solid 1px RGB(208,215,227)",
            borderRadius: '10px',
            width: "100%",
            boxShadow: 'rgba(0, 0, 0, 0.15) 1.95px 1.95px 2.6px',
            overflow: 'hidden',
        }}>
            <div style={{ display: 'flex', height: '5px' }}>
                {itinerary.legs.map((leg, i) => (
                    <div
                        key={i}
                        style={{
                            flex: leg.duration,
                            background: leg.transitLeg ? `#${getRouteColor(leg)}` : 'RGB(208,215,227)'
                        }}
                    />
                ))}
            </div>

            <div style={{ padding: "12px" }}>
                <div style={{ display: "flex", gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {transitLegs.map((leg, i) => (
                        <Marker
                            key={i}
                            type={leg.vehicleType}
                            name={leg.routeShortName}
                        />
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '2px' }}>
                            Ajungi la ora: <b>{arrivalTime}</b>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                            {summary}
                        </div>
                        {itinerary.transfers > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#e07b00', marginTop: '2px' }}>
                                {itinerary.transfers} schimb{itinerary.transfers > 1 ? 'uri' : ''}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '2.2rem', lineHeight: 1 }}>{value}</span>
                        <span style={{ color: 'gray', fontSize: '0.85rem' }}>{unit}</span>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '10px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                }}>
                    {itinerary.legs.map((leg, i) => {
                        if (leg.mode === 'WALK') {
                            const walkMin = Math.round(leg.duration / 60);
                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    flexShrink: 0,
                                    color: 'gray',
                                }}>
                                    {i > 0 && <span style={{ fontSize: '0.7rem' }}>→</span>}
                                    <FaWalking size={13} />
                                    <span style={{ fontSize: '0.72rem' }}>{walkMin} min</span>
                                </div>
                            );
                        }

                        if (leg.transitLeg) {
                            return (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexShrink: 0,
                                }}>
                                    {i > 0 && <span style={{ fontSize: '0.7rem', color: 'gray' }}>→</span>}
                                    <div style={{
                                        background: `#${getRouteColor(leg)}22`,
                                        border: `1px solid #${getRouteColor(leg)}`,
                                        color: `#${getRouteColor(leg)}`,
                                        borderRadius: '6px',
                                        padding: '2px 7px',
                                        fontSize: '0.72rem',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {leg.from.name} → {leg.to.name}
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>

                <Button
                    variant='undefined'
                    style={{
                        width: "100%",
                        marginTop: '12px',
                        background: "RGB(132, 89, 160)",
                        color: "white",
                        borderRadius: '8px',
                    }}
                    onClick={() => onSelect(itinerary)}
                >
                    Alege
                </Button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Directions() {
    const nav = useNavigate();
    const [originSearchValue, setOriginSearchValue] = useState('');
    const [destinationSearchValue, setDestinationSearchValue] = useState('');
    const [searchParams] = useSearchParams();

    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);

    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [isOriginFocused, setIsOriginFocused] = useState(false);

    const [itineraries, setItineraries] = useState([]);
    const [routeHistory, setRouteHistory] = useState([]);

    const lineTypeCacheRef = useRef(null);

    const mockData = "{\"plan\":{\"date\":1773488349000,\"from\":{\"lat\":46.74847021734982,\"lon\":23.56757577988606,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"itineraries\":[{\"accessibility\":\"None\",\"duration\":2808,\"endTime\":1773491273000,\"legs\":[{\"distance\":994,\"duration\":835,\"endTime\":1773489300000,\"from\":{\"lat\":46.74847784603872,\"lon\":23.5675973072648,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"legGeometry\":{\"length\":40,\"points\":\"}pi|Gm`znCc@X??mHlEsElBk@\\\\w@r@c@`@i@b@a@b@??oCvA??BHMHKR??G???eEv@gBFQ???[D??kAE??QB??OVIf@??AdA??D|BBdC??FA??DA\"},\"mode\":\"WALK\",\"startTime\":1773488465000,\"steps\":[],\"to\":{\"lat\":46.75538911945495,\"lon\":23.5620129480958,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false},{\"agencyId\":\"CLUJRO:2\",\"agencyName\":\"CTP Cluj\",\"distance\":6658.349577245983,\"duration\":1920,\"endTime\":1773491220000,\"from\":{\"globalStopId\":\"CLUJRO:316\",\"lat\":46.75538545297143,\"lon\":23.56194997342318,\"name\":\"Izlazului\",\"stopId\":\"CLUJRO:4\",\"stopIndex\":3,\"vertexType\":\"TRANSIT\"},\"globalRouteId\":\"CLUJRO:331426\",\"headsign\":\"Snagov Nord\",\"intermediateStops\":[{\"name\":\"Calea Mănăștur\",\"lat\":46.76074540217097,\"lon\":23.56443209754914},{\"name\":\"Agronomia\",\"lat\":46.76258900885873,\"lon\":23.57135686413243}],\"mode\":\"BUS\",\"route\":\"25\",\"routeColor\":\"3c4e9a\",\"routeShortName\":\"25\",\"routeTextColor\":\"ffffff\",\"startTime\":1773489300000,\"steps\":[],\"to\":{\"globalStopId\":\"CLUJRO:328\",\"lat\":46.77145630736669,\"lon\":23.62520816582175,\"name\":\"Iulius Mall Vest\",\"stopId\":\"CLUJRO:173\",\"stopIndex\":15,\"vertexType\":\"TRANSIT\"},\"transitLeg\":true,\"tripId\":\"CLUJRO:14_0_S_49_1350\"},{\"distance\":60,\"duration\":53,\"endTime\":1773491273000,\"from\":{\"lat\":46.77147898678061,\"lon\":23.62522792071104,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"mode\":\"WALK\",\"startTime\":1773491220000,\"steps\":[],\"to\":{\"lat\":46.77146543837667,\"lon\":23.62568456679583,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false}],\"startTime\":1773488465000,\"transfers\":0,\"transitTime\":1920,\"walkTime\":888},{\"accessibility\":\"None\",\"duration\":2868,\"endTime\":1773491333000,\"legs\":[{\"distance\":994,\"duration\":835,\"endTime\":1773489300000,\"from\":{\"lat\":46.74847784603872,\"lon\":23.5675973072648,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"mode\":\"WALK\",\"startTime\":1773488465000,\"steps\":[],\"to\":{\"lat\":46.75538911945495,\"lon\":23.5620129480958,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false},{\"agencyId\":\"CLUJRO:2\",\"distance\":3751.496584721422,\"duration\":840,\"endTime\":1773490140000,\"from\":{\"globalStopId\":\"CLUJRO:316\",\"lat\":46.75538545297143,\"lon\":23.56194997342318,\"name\":\"Izlazului\",\"stopId\":\"CLUJRO:4\",\"stopIndex\":3,\"vertexType\":\"TRANSIT\"},\"headsign\":\"Snagov Nord\",\"intermediateStops\":[{\"name\":\"Calea Mănăștur\"},{\"name\":\"Agronomia\"},{\"name\":\"Calea Moților\"},{\"name\":\"Memorandumului Sud\"},{\"name\":\"Victoria\"}],\"mode\":\"BUS\",\"route\":\"25\",\"routeColor\":\"3c4e9a\",\"routeShortName\":\"25\",\"startTime\":1773489300000,\"steps\":[],\"to\":{\"globalStopId\":\"CLUJRO:322\",\"lat\":46.77297615873368,\"lon\":23.59694252767721,\"name\":\"Regionala CFR\",\"stopId\":\"CLUJRO:10\",\"stopIndex\":9,\"vertexType\":\"TRANSIT\"},\"transitLeg\":true},{\"distance\":356,\"duration\":293,\"endTime\":1773490433000,\"from\":{\"lat\":46.77299271241098,\"lon\":23.59692960977554,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"mode\":\"WALK\",\"startTime\":1773490140000,\"steps\":[],\"to\":{\"lat\":46.77107505917324,\"lon\":23.59862141311169,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false},{\"agencyId\":\"CLUJRO:2\",\"distance\":2685.502642981711,\"duration\":540,\"endTime\":1773491280000,\"from\":{\"globalStopId\":\"CLUJRO:2145\",\"lat\":46.77106959962243,\"lon\":23.59862425670458,\"name\":\"Tribunal\",\"stopId\":\"CLUJRO:366\",\"stopIndex\":14,\"vertexType\":\"TRANSIT\"},\"headsign\":\"Disp. Unirii\",\"intermediateStops\":[{\"name\":\"Rubin Patitia\"},{\"name\":\"Simion Bărnuțiu\"},{\"name\":\"Biblioteca Județeană\"},{\"name\":\"Campus Universitar Vest\"}],\"mode\":\"BUS\",\"route\":\"45\",\"routeColor\":\"d24cae\",\"routeShortName\":\"45\",\"startTime\":1773490740000,\"steps\":[],\"to\":{\"globalStopId\":\"CLUJRO:2150\",\"lat\":46.77145630736669,\"lon\":23.62520816582175,\"name\":\"Iulius Mall Vest\",\"stopId\":\"CLUJRO:173\",\"stopIndex\":19,\"vertexType\":\"TRANSIT\"},\"transitLeg\":true},{\"distance\":60,\"duration\":53,\"endTime\":1773491333000,\"from\":{\"lat\":46.77147898678061,\"lon\":23.62522792071104,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"mode\":\"WALK\",\"startTime\":1773491280000,\"steps\":[],\"to\":{\"lat\":46.77146543837667,\"lon\":23.62568456679583,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false}],\"startTime\":1773488465000,\"transfers\":1,\"transitTime\":1380,\"walkTime\":1181},{\"accessibility\":\"None\",\"duration\":3084,\"endTime\":1773491573000,\"legs\":[{\"distance\":1543,\"duration\":1291,\"endTime\":1773489780000,\"from\":{\"lat\":46.74847784603872,\"lon\":23.5675973072648,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"mode\":\"WALK\",\"startTime\":1773488489000,\"steps\":[],\"to\":{\"lat\":46.76073150572846,\"lon\":23.56443900614977,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false},{\"agencyId\":\"CLUJRO:2\",\"distance\":5696.276667457071,\"duration\":1740,\"endTime\":1773491520000,\"from\":{\"globalStopId\":\"CLUJRO:299\",\"lat\":46.76074540217097,\"lon\":23.56443209754914,\"name\":\"Calea Mănăștur\",\"stopId\":\"CLUJRO:5\",\"stopIndex\":3,\"vertexType\":\"TRANSIT\"},\"headsign\":\"Disp. Unirii\",\"intermediateStops\":[{\"name\":\"Agronomia\"},{\"name\":\"Calea Moților\"},{\"name\":\"Memorandumului Sud\"},{\"name\":\"Victoria\"},{\"name\":\"Regionala CFR\"},{\"name\":\"Biserica Sf. Petru\"},{\"name\":\"P-Ța Mărăști\"},{\"name\":\"Mareșal C-Tin Prezan\"},{\"name\":\"Dorobanților\"},{\"name\":\"Campus Universitar Vest\"}],\"mode\":\"BUS\",\"route\":\"24B\",\"routeColor\":\"d24cae\",\"routeShortName\":\"24B\",\"startTime\":1773489780000,\"steps\":[],\"to\":{\"globalStopId\":\"CLUJRO:310\",\"lat\":46.77145630736669,\"lon\":23.62520816582175,\"name\":\"Iulius Mall Vest\",\"stopId\":\"CLUJRO:173\",\"stopIndex\":14,\"vertexType\":\"TRANSIT\"},\"transitLeg\":true},{\"distance\":60,\"duration\":53,\"endTime\":1773491573000,\"from\":{\"lat\":46.77147898678061,\"lon\":23.62522792071104,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"mode\":\"WALK\",\"startTime\":1773491520000,\"steps\":[],\"to\":{\"lat\":46.77146543837667,\"lon\":23.62568456679583,\"name\":\"\",\"vertexType\":\"NORMAL\"},\"transitLeg\":false}],\"startTime\":1773488489000,\"transfers\":0,\"transitTime\":1740,\"walkTime\":1344}],\"to\":{\"lat\":46.77147370855037,\"lon\":23.62569363503033,\"name\":\"\",\"vertexType\":\"NORMAL\"}}}";

    const getUserAddress = async () => {
        try {
            const latitude = searchParams.get("userLat");
            const longitude = searchParams.get("userLng");
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
            const data = await fetch(url, { headers: { "User-Agent": "Busify" } });
            const resp = await data.json();
            const address = resp.address;
            setOriginSearchValue(`${address.road || ""} ${address.house_number || ""}`);
        } catch (e) {
            console.log(e);
        }
    };

    const getSuggestions = async (input) => {
        try {
            const url = `https://photon.komoot.io/api/?q=${input}&lat=46.7712&lon=23.6236&limit=5`;
            const data = await fetch(url);
            return await data.json();
        } catch (e) {
            console.log(e);
        }
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const reverseGeocode = async (lon, lat) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
            const data = await fetch(url, { headers: { "User-Agent": "Busify Suggestions" } });
            if (!data.ok) return "";
            const resp = await data.json();
            const address = resp.address;
            return [address.road, address.house_number].filter(Boolean).join(", ");
        } catch (e) {
            return "";
        }
    };

    const buildSuggestions = async (r) => {
        const seen = new Set();
        const unique = r.features.filter(el => {
            const name = el.properties.name;
            if (seen.has(name)) return false;
            seen.add(name);
            return true;
        });
        const results = [];
        for (const el of unique) {
            const [lon, lat] = el.geometry.coordinates;
            const address = await reverseGeocode(lon, lat);
            results.push({ name: el.properties.name, address, lat, lon });
            await delay(250);
        }
        return results;
    };

    const getLineType = async (routeName) => {
        if (!lineTypeCacheRef.current) {
            const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
            const buses_basic = await resp.json();
            const cache = {};
            [...buses_basic.urbane, ...buses_basic.metropolitane, ...buses_basic.market, ...buses_basic.noapte]
                .forEach(line => { cache[line.name] = line.type; });
            lineTypeCacheRef.current = cache;
        }
        return lineTypeCacheRef.current[routeName] ?? 'autobuze';
    };

    const enrichItineraries = async (itineraries) => {
        return Promise.all(itineraries.map(async (itin) => ({
            ...itin,
            legs: await Promise.all(itin.legs.map(async (leg) => ({
                ...leg,
                vehicleType: leg.transitLeg ? await getLineType(leg.routeShortName) : null,
            }))),
        })));
    };

    const searchRoute = async (overrideOrigin, overrideDestination) => {
        const origin = overrideOrigin ?? originSearchValue;
        const destination = overrideDestination ?? destinationSearchValue;

        if (!origin.trim() || !destination.trim()) return;

        const updated = saveToHistory(origin, destination);
        setRouteHistory(updated);

        // TODO: replace with real API call
        const data = JSON.parse(mockData);
        const enriched = await enrichItineraries(data.plan.itineraries);
        setItineraries(enriched);
    };

    // Load history on mount
    useEffect(() => {
        setRouteHistory(loadHistory());
    }, []);

    useEffect(() => {
        if (originSearchValue) return;
        getUserAddress();
    }, []);

    useEffect(() => {
        if (!originSearchValue) return;
        const timer = setTimeout(() => {
            getSuggestions(originSearchValue)
                .then(r => buildSuggestions(r))
                .then(suggestions => {
                    if (suggestions.length > 0) setOriginSuggestions(suggestions);
                })
                .catch(err => console.error(err));
        }, 1000);
        return () => clearTimeout(timer);
    }, [originSearchValue]);

    useEffect(() => {
        if (!destinationSearchValue) return;
        const timer = setTimeout(() => {
            getSuggestions(destinationSearchValue)
                .then(r => buildSuggestions(r))
                .then(suggestions => {
                    if (suggestions.length > 0) setDestinationSuggestions(suggestions);
                })
                .catch(err => console.error(err));
        }, 500);
        return () => clearTimeout(timer);
    }, [destinationSearchValue]);

    return (
        <div className="orare">
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                zIndex: 10,
                width: "90%",
            }}>
                <div><b> Lucrăm cu spor la propriul sistem de direcții pas cu pas! </b></div>
                <div> Acesta va fi disponibil exclusiv abonaților.</div>
                <Button style={{margin: '15px', visibility: !localStorage.hasOwnProperty("active_subscription") ? "visible" : "hidden"}} onClick={() => {nav('/setari?abonare=true')}}><b>Devino abonat!</b></Button>
                <Button variant={'undefined'} style={{outline: 'solid 1px'}} onClick={() => {nav(-1)}} > Înapoi </Button>
            </div>
            <div style={{filter: "blur(4px)", pointerEvents: "none", userSelect: "none"}}>
            <div className="orare-content-header" style={{padding: "20px"}}>
                <BackButton style={{marginRight: "auto"}} onClick={() => {nav(-1)}}/>
                <h2 style={{marginBottom: '20px'}}><b>Direcții pas cu pas</b></h2>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
                    <Decoration style={{ flexShrink: 0, marginTop: "5px" }} />
                    <Form style={{ flex: 1 }}>
                        <form onSubmit={(e) => { e.preventDefault(); searchRoute(); }}>
                            <Form.Group style={{ display: "flex", flexDirection: "column", gap: "20px", margin: 0 }}>
                                <Dropdown show={originSuggestions.length > 0 && isOriginFocused}>
                                    <InputGroup>
                                        <Form.Control
                                            type="text"
                                            placeholder="Start"
                                            inputMode="search"
                                            value={originSearchValue}
                                            onChange={(e) => setOriginSearchValue(e.target.value)}
                                            onFocus={() => setIsOriginFocused(true)}
                                            onBlur={() => setTimeout(() => setIsOriginFocused(false), 150)}
                                        />
                                        <InputGroup.Text>
                                            <LocationIcon
                                                style={{ filter: "brightness(0) saturate(100%) invert(68%) sepia(28%) saturate(666%) hue-rotate(94deg) brightness(90%) contrast(88%)" }}
                                                onClick={() => { setOriginSuggestions([]); getUserAddress(); }}
                                            />
                                        </InputGroup.Text>
                                    </InputGroup>
                                    <Dropdown.Menu style={{ width: "100%" }}>
                                        {originSuggestions.map((suggestion, index) => (
                                            <Dropdown.Item
                                                key={index}
                                                style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                                                onClick={() => {
                                                    setOriginSearchValue(suggestion.name);
                                                    setOriginSuggestions([]);
                                                }}
                                            >
                                                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{suggestion.name}</div>
                                                {suggestion.address ? (
                                                    <div style={{ fontSize: "0.75rem", color: "gray", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {suggestion.address}
                                                    </div>
                                                ) : null}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>

                                <Dropdown show={destinationSuggestions.length > 0 && isDestinationFocused}>
                                    <Form.Control
                                        type="text"
                                        inputMode="search"
                                        placeholder="Destinație"
                                        value={destinationSearchValue}
                                        onFocus={() => setIsDestinationFocused(true)}
                                        onBlur={() => setTimeout(() => setIsDestinationFocused(false), 150)}
                                        onChange={(e) => setDestinationSearchValue(e.target.value)}
                                    />
                                    <Dropdown.Menu style={{ width: "100%" }}>
                                        {destinationSuggestions.map((suggestion, index) => (
                                            <Dropdown.Item
                                                key={index}
                                                style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                                                onClick={() => {
                                                    setDestinationSearchValue(suggestion.name);
                                                    setDestinationSuggestions([]);
                                                }}
                                            >
                                                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{suggestion.name}</div>
                                                {suggestion.address ? (
                                                    <div style={{ fontSize: "0.75rem", color: "gray", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                        {suggestion.address}
                                                    </div>
                                                ) : null}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Form.Group>
                        </form>
                    </Form>
                    <SwitchIcon style={{scale: "1.2", margin: "3px"}} onClick={() => {
                        const t = originSearchValue;
                        setOriginSearchValue(destinationSearchValue);
                        setDestinationSearchValue(t);
                    }}/>
                </div>
                <Button
                    style={{ width: "100%", background: "white", boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px', marginTop: "20px", color: 'black' }}
                    variant='undefined'
                    onClick={() => searchRoute()}
                >
                    Caută rută
                </Button>
            </div>

            <div className='orare-body-container' style={{padding: '20px'}}>

                {itineraries.length === 0 && routeHistory.length === 0 && (
                    <div style={{display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "center", textAlign: "center"}}>
                        <b>Hai la drum!</b>
                        Sistemul nostru folosește locația vehiculelor și traficul în timp real ca să ne asigurăm că ai parte de cea mai rapidă călătorie!
                    </div>
                )}

                {itineraries.length === 0 && routeHistory.length > 0 && (
                    <div style={{ width: '100%', marginBottom: '24px' }}>
                        <div style={{ color: 'gray', marginBottom: '10px' }}><b>Recomandate</b></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {routeHistory.map((entry, index) => (
                                <HistoryCard
                                    key={index}
                                    entry={entry}
                                    onSelect={(e) => {
                                        setOriginSearchValue(e.origin);
                                        setDestinationSearchValue(e.destination);
                                        searchRoute(e.origin, e.destination);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {itineraries.length > 0 && (
                    <div style={{ width: '100%' }}>
                        <div style={{ color: 'gray', marginBottom: '10px' }}><b>Rezultate</b></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {itineraries.map((itinerary, index) => (
                                <ItineraryCard
                                    key={index}
                                    itinerary={itinerary}
                                    onSelect={(it) => {
                                        console.log("Selected itinerary:", it);
                                        // TODO: navigate to detail view or show on map
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <br/> <br/> <br/>
        </div>
        </div>
    );
}

export default Directions;