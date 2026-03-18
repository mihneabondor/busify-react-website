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
import Spinner from "react-bootstrap/Spinner";
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
const saveToHistory = (origin, destination, originCoords, destinationCoords) => {
    const existing = loadHistory();
    const entry = { origin, destination, originCoords, destinationCoords, timestamp: Date.now() };
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
    const [originCoords, setOriginCoords] = useState(null); // { lat, lon }
    const [destinationCoords, setDestinationCoords] = useState(null); // { lat, lon }
    const [searchParams] = useSearchParams();

    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);

    const [originSuggestions, setOriginSuggestions] = useState([]);
    const [isOriginFocused, setIsOriginFocused] = useState(false);

    const [itineraries, setItineraries] = useState([]);
    const [routeHistory, setRouteHistory] = useState([]);

    const [isLoadingOriginSuggestions, setIsLoadingOriginSuggestions] = useState(false);
    const [isLoadingDestinationSuggestions, setIsLoadingDestinationSuggestions] = useState(false);
    const [isSearchingRoute, setIsSearchingRoute] = useState(false);

    const lineTypeCacheRef = useRef(null);

    const mockData = "{\n" +
        "  \"plan\": {\n" +
        "    \"date\": 1773488349000,\n" +
        "    \"from\": {\n" +
        "      \"lat\": 46.74847021734982,\n" +
        "      \"lon\": 23.56757577988606,\n" +
        "      \"name\": \"\",\n" +
        "      \"vertexType\": \"NORMAL\"\n" +
        "    },\n" +
        "    \"itineraries\": [\n" +
        "      {\n" +
        "        \"accessibility\": \"None\",\n" +
        "        \"duration\": 2808,\n" +
        "        \"endTime\": 1773491273000,\n" +
        "        \"legs\": [\n" +
        "          {\n" +
        "            \"distance\": 994,\n" +
        "            \"duration\": 835,\n" +
        "            \"endTime\": 1773489300000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.74847784603872,\n" +
        "              \"lon\": 23.5675973072648,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 40,\n" +
        "              \"points\": \"}pi|Gm`znCc@X??mHlEsElBk@\\\\w@r@c@`@i@b@a@b@??oCvA??BHMHKR??G???eEv@gBFQ???[D??kAE??QB??OVIf@??AdA??D|BBdC??FA??DA\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773488465000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.75538911945495,\n" +
        "              \"lon\": 23.5620129480958,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          },\n" +
        "          {\n" +
        "            \"agencyId\": \"CLUJRO:2\",\n" +
        "            \"agencyName\": \"CTP Cluj\",\n" +
        "            \"agencyTimeZoneOffset\": 7200000,\n" +
        "            \"agencyUrl\": \"http://transitapp.com\",\n" +
        "            \"arrivalDelay\": 0,\n" +
        "            \"departureDelay\": 0,\n" +
        "            \"distance\": 6658.349577245983,\n" +
        "            \"duration\": 1920,\n" +
        "            \"endTime\": 1773491220000,\n" +
        "            \"from\": {\n" +
        "              \"globalStopId\": \"CLUJRO:316\",\n" +
        "              \"lat\": 46.75538545297143,\n" +
        "              \"lon\": 23.56194997342318,\n" +
        "              \"name\": \"Izlazului\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:4\",\n" +
        "              \"stopIndex\": 3,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"globalRouteId\": \"CLUJRO:331426\",\n" +
        "            \"headsign\": \"Snagov Nord\",\n" +
        "            \"interlineWithPreviousLeg\": false,\n" +
        "            \"intermediateStops\": [\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:317\",\n" +
        "                \"lat\": 46.76074540217097,\n" +
        "                \"lon\": 23.56443209754914,\n" +
        "                \"name\": \"Calea Mănăștur\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:5\",\n" +
        "                \"stopIndex\": 4,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:318\",\n" +
        "                \"lat\": 46.76258900885873,\n" +
        "                \"lon\": 23.57135686413243,\n" +
        "                \"name\": \"Agronomia\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:6\",\n" +
        "                \"stopIndex\": 5,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:319\",\n" +
        "                \"lat\": 46.76611434457386,\n" +
        "                \"lon\": 23.5796036316089,\n" +
        "                \"name\": \"Calea Moților\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:7\",\n" +
        "                \"stopIndex\": 6,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:320\",\n" +
        "                \"lat\": 46.76962169388229,\n" +
        "                \"lon\": 23.58712194961362,\n" +
        "                \"name\": \"Memorandumului Sud\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:8\",\n" +
        "                \"stopIndex\": 7,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:321\",\n" +
        "                \"lat\": 46.77166315104385,\n" +
        "                \"lon\": 23.59277867452387,\n" +
        "                \"name\": \"Victoria\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:9\",\n" +
        "                \"stopIndex\": 8,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:322\",\n" +
        "                \"lat\": 46.77297615873368,\n" +
        "                \"lon\": 23.59694252767721,\n" +
        "                \"name\": \"Regionala CFR\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:10\",\n" +
        "                \"stopIndex\": 9,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:323\",\n" +
        "                \"lat\": 46.77624069155151,\n" +
        "                \"lon\": 23.60628646596298,\n" +
        "                \"name\": \"Biserica Sf. Petru\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:168\",\n" +
        "                \"stopIndex\": 10,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:324\",\n" +
        "                \"lat\": 46.77757168564804,\n" +
        "                \"lon\": 23.61127769382496,\n" +
        "                \"name\": \"P-Ța Mărăști\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:169\",\n" +
        "                \"stopIndex\": 11,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:325\",\n" +
        "                \"lat\": 46.77839006715334,\n" +
        "                \"lon\": 23.61579228190914,\n" +
        "                \"name\": \"Mareșal C-Tin Prezan\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:170\",\n" +
        "                \"stopIndex\": 12,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:326\",\n" +
        "                \"lat\": 46.77787745456211,\n" +
        "                \"lon\": 23.61994714185911,\n" +
        "                \"name\": \"Dorobanților\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:171\",\n" +
        "                \"stopIndex\": 13,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:327\",\n" +
        "                \"lat\": 46.77410930235639,\n" +
        "                \"lon\": 23.62166484369991,\n" +
        "                \"name\": \"Campus Universitar Vest\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:172\",\n" +
        "                \"stopIndex\": 14,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              }\n" +
        "            ],\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 116,\n" +
        "              \"points\": \"g|j|Gq}xnC@?Q?MeIBeADAJUCUGIIGMBKLc@ZkBb@_@PyA|@uAjAaBfAm@Zc@LQBqAGgBMiBUmA?]SQc@WcAY}Bu@wEuAcGUuAqAcLq@iF_@wB}AiGg@}BMc@Q[eBsBcBcCkAyBSy@o@eDcCyKoAaF_A{DgBoFmE}KoCqGgAsCmAuDqDiLkBsFe@_AQk@mDmQ{@sFk@wC}A{GB?W{@Vv@CB_@kA}DyNmF_Sq@{CyA{GPMQLMc@g@yDy@{Ec@kBy@gCq@mDWgBQoB}@{HmAcM@u@Js@C_@MWKKIEUy@qAoMG]Q[MqAFu@h@yBPa@b@q@tAgApIsCtEgB~C_AdA_@zAk@`@MlAy@TUb@q@^y@Lc@n@qAVUTIBMCYX_BpAiDDK\"\n" +
        "            },\n" +
        "            \"mode\": \"BUS\",\n" +
        "            \"realTime\": false,\n" +
        "            \"route\": \"25\",\n" +
        "            \"routeColor\": \"3c4e9a\",\n" +
        "            \"routeId\": \"CLUJRO:14\",\n" +
        "            \"routeLongName\": \"Str. Bucium - Str. Unirii\",\n" +
        "            \"routeShortName\": \"25\",\n" +
        "            \"routeTextColor\": \"ffffff\",\n" +
        "            \"routeType\": 3,\n" +
        "            \"startTime\": 1773489300000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"globalStopId\": \"CLUJRO:328\",\n" +
        "              \"lat\": 46.77145630736669,\n" +
        "              \"lon\": 23.62520816582175,\n" +
        "              \"name\": \"Iulius Mall Vest\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:173\",\n" +
        "              \"stopIndex\": 15,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"transitLeg\": true,\n" +
        "            \"tripBlockId\": \"\",\n" +
        "            \"tripId\": \"CLUJRO:14_0_S_49_1350\",\n" +
        "            \"tripShortName\": \"\"\n" +
        "          },\n" +
        "          {\n" +
        "            \"distance\": 60,\n" +
        "            \"duration\": 53,\n" +
        "            \"endTime\": 1773491273000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.77147898678061,\n" +
        "              \"lon\": 23.62522792071104,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 11,\n" +
        "              \"points\": \"u`n|GsheoCGP??KQACIQ??FOFQ??Pc@\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773491220000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.77146543837667,\n" +
        "              \"lon\": 23.62568456679583,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          }\n" +
        "        ],\n" +
        "        \"startTime\": 1773488465000,\n" +
        "        \"transfers\": 0,\n" +
        "        \"transitTime\": 1920,\n" +
        "        \"walkTime\": 888,\n" +
        "        \"wheelchairNeed\": \"None\"\n" +
        "      },\n" +
        "      {\n" +
        "        \"accessibility\": \"None\",\n" +
        "        \"duration\": 2868,\n" +
        "        \"endTime\": 1773491333000,\n" +
        "        \"legs\": [\n" +
        "          {\n" +
        "            \"distance\": 994,\n" +
        "            \"duration\": 835,\n" +
        "            \"endTime\": 1773489300000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.74847784603872,\n" +
        "              \"lon\": 23.5675973072648,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 40,\n" +
        "              \"points\": \"}pi|Gm`znCc@X??mHlEsElBk@\\\\w@r@c@`@i@b@a@b@??oCvA??BHMHKR??G???eEv@gBFQ???[D??kAE??QB??OVIf@??AdA??D|BBdC??FA??DA\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773488465000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.75538911945495,\n" +
        "              \"lon\": 23.5620129480958,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          },\n" +
        "          {\n" +
        "            \"agencyId\": \"CLUJRO:2\",\n" +
        "            \"agencyName\": \"CTP Cluj\",\n" +
        "            \"agencyTimeZoneOffset\": 7200000,\n" +
        "            \"agencyUrl\": \"http://transitapp.com\",\n" +
        "            \"arrivalDelay\": 0,\n" +
        "            \"departureDelay\": 0,\n" +
        "            \"distance\": 3751.496584721422,\n" +
        "            \"duration\": 840,\n" +
        "            \"endTime\": 1773490140000,\n" +
        "            \"from\": {\n" +
        "              \"globalStopId\": \"CLUJRO:316\",\n" +
        "              \"lat\": 46.75538545297143,\n" +
        "              \"lon\": 23.56194997342318,\n" +
        "              \"name\": \"Izlazului\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:4\",\n" +
        "              \"stopIndex\": 3,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"globalRouteId\": \"CLUJRO:331426\",\n" +
        "            \"headsign\": \"Snagov Nord\",\n" +
        "            \"interlineWithPreviousLeg\": false,\n" +
        "            \"intermediateStops\": [\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:317\",\n" +
        "                \"lat\": 46.76074540217097,\n" +
        "                \"lon\": 23.56443209754914,\n" +
        "                \"name\": \"Calea Mănăștur\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:5\",\n" +
        "                \"stopIndex\": 4,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:318\",\n" +
        "                \"lat\": 46.76258900885873,\n" +
        "                \"lon\": 23.57135686413243,\n" +
        "                \"name\": \"Agronomia\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:6\",\n" +
        "                \"stopIndex\": 5,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:319\",\n" +
        "                \"lat\": 46.76611434457386,\n" +
        "                \"lon\": 23.5796036316089,\n" +
        "                \"name\": \"Calea Moților\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:7\",\n" +
        "                \"stopIndex\": 6,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:320\",\n" +
        "                \"lat\": 46.76962169388229,\n" +
        "                \"lon\": 23.58712194961362,\n" +
        "                \"name\": \"Memorandumului Sud\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:8\",\n" +
        "                \"stopIndex\": 7,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:321\",\n" +
        "                \"lat\": 46.77166315104385,\n" +
        "                \"lon\": 23.59277867452387,\n" +
        "                \"name\": \"Victoria\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:9\",\n" +
        "                \"stopIndex\": 8,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              }\n" +
        "            ],\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 62,\n" +
        "              \"points\": \"g|j|Gq}xnC@?Q?MeIBeADAJUCUGIIGMBKLc@ZkBb@_@PyA|@uAjAaBfAm@Zc@LQBqAGgBMiBUmA?]SQc@WcAY}Bu@wEuAcGUuAqAcLq@iF_@wB}AiGg@}BMc@Q[eBsBcBcCkAyBSy@o@eDcCyKoAaF_A{DgBoFmE}KoCqGgAsCmAuDqDiLkBsFe@_AQk@mDmQ{@sFk@wC}A{GB?Wy@\"\n" +
        "            },\n" +
        "            \"mode\": \"BUS\",\n" +
        "            \"realTime\": false,\n" +
        "            \"route\": \"25\",\n" +
        "            \"routeColor\": \"3c4e9a\",\n" +
        "            \"routeId\": \"CLUJRO:14\",\n" +
        "            \"routeLongName\": \"Str. Bucium - Str. Unirii\",\n" +
        "            \"routeShortName\": \"25\",\n" +
        "            \"routeTextColor\": \"ffffff\",\n" +
        "            \"routeType\": 3,\n" +
        "            \"startTime\": 1773489300000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"globalStopId\": \"CLUJRO:322\",\n" +
        "              \"lat\": 46.77297615873368,\n" +
        "              \"lon\": 23.59694252767721,\n" +
        "              \"name\": \"Regionala CFR\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:10\",\n" +
        "              \"stopIndex\": 9,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"transitLeg\": true,\n" +
        "            \"tripBlockId\": \"\",\n" +
        "            \"tripId\": \"CLUJRO:14_0_S_49_1350\",\n" +
        "            \"tripShortName\": \"\"\n" +
        "          },\n" +
        "          {\n" +
        "            \"distance\": 356,\n" +
        "            \"duration\": 293,\n" +
        "            \"endTime\": 1773490433000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.77299271241098,\n" +
        "              \"lon\": 23.59692960977554,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 13,\n" +
        "              \"points\": \"ejn|Gww_oCV|@Lb@??JGtI_FAK??RGPG??GSc@}C\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773490140000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.77107505917324,\n" +
        "              \"lon\": 23.59862141311169,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          },\n" +
        "          {\n" +
        "            \"agencyId\": \"CLUJRO:2\",\n" +
        "            \"agencyName\": \"CTP Cluj\",\n" +
        "            \"agencyTimeZoneOffset\": 7200000,\n" +
        "            \"agencyUrl\": \"http://transitapp.com\",\n" +
        "            \"arrivalDelay\": 0,\n" +
        "            \"departureDelay\": 0,\n" +
        "            \"distance\": 2685.502642981711,\n" +
        "            \"duration\": 540,\n" +
        "            \"endTime\": 1773491280000,\n" +
        "            \"from\": {\n" +
        "              \"globalStopId\": \"CLUJRO:2145\",\n" +
        "              \"lat\": 46.77106959962243,\n" +
        "              \"lon\": 23.59862425670458,\n" +
        "              \"name\": \"Tribunal\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:366\",\n" +
        "              \"stopIndex\": 14,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"globalRouteId\": \"CLUJRO:331497\",\n" +
        "            \"headsign\": \"Disp. Unirii\",\n" +
        "            \"interlineWithPreviousLeg\": false,\n" +
        "            \"intermediateStops\": [\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:2146\",\n" +
        "                \"lat\": 46.77232864809212,\n" +
        "                \"lon\": 23.60403816512424,\n" +
        "                \"name\": \"Rubin Patitia\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:823\",\n" +
        "                \"stopIndex\": 15,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:2147\",\n" +
        "                \"lat\": 46.77340783249471,\n" +
        "                \"lon\": 23.60722175911189,\n" +
        "                \"name\": \"Simion Bărnuțiu\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:701\",\n" +
        "                \"stopIndex\": 16,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:2148\",\n" +
        "                \"lat\": 46.77657344007564,\n" +
        "                \"lon\": 23.61384075678112,\n" +
        "                \"name\": \"Biblioteca Județeană\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:368\",\n" +
        "                \"stopIndex\": 17,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:2149\",\n" +
        "                \"lat\": 46.77410930235639,\n" +
        "                \"lon\": 23.62166484369991,\n" +
        "                \"name\": \"Campus Universitar Vest\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:172\",\n" +
        "                \"stopIndex\": 18,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              }\n" +
        "            ],\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 34,\n" +
        "              \"points\": \"e~m|Gib`oCwB{OyBkN_BoIwAsFmBsGaAkBcKcR[}@c@cBoAwMMBCC}@wJyBeTzG}BdE{ABHp@UhBi@|CcA@C?Mr@YlAy@TUb@q@^y@Lc@b@kB|AcDp@eBLNZ{@\"\n" +
        "            },\n" +
        "            \"mode\": \"BUS\",\n" +
        "            \"realTime\": false,\n" +
        "            \"route\": \"45\",\n" +
        "            \"routeColor\": \"d24cae\",\n" +
        "            \"routeId\": \"CLUJRO:113\",\n" +
        "            \"routeLongName\": \"Zorilor - Unirii\",\n" +
        "            \"routeShortName\": \"45\",\n" +
        "            \"routeTextColor\": \"ffffff\",\n" +
        "            \"routeType\": 3,\n" +
        "            \"startTime\": 1773490740000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"globalStopId\": \"CLUJRO:2150\",\n" +
        "              \"lat\": 46.77145630736669,\n" +
        "              \"lon\": 23.62520816582175,\n" +
        "              \"name\": \"Iulius Mall Vest\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:173\",\n" +
        "              \"stopIndex\": 19,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"transitLeg\": true,\n" +
        "            \"tripBlockId\": \"\",\n" +
        "            \"tripId\": \"CLUJRO:113_0_S_18_1355\",\n" +
        "            \"tripShortName\": \"\"\n" +
        "          },\n" +
        "          {\n" +
        "            \"distance\": 60,\n" +
        "            \"duration\": 53,\n" +
        "            \"endTime\": 1773491333000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.77147898678061,\n" +
        "              \"lon\": 23.62522792071104,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 11,\n" +
        "              \"points\": \"u`n|GsheoCGP??KQACIQ??FOFQ??Pc@\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773491280000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.77146543837667,\n" +
        "              \"lon\": 23.62568456679583,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          }\n" +
        "        ],\n" +
        "        \"startTime\": 1773488465000,\n" +
        "        \"transfers\": 1,\n" +
        "        \"transitTime\": 1380,\n" +
        "        \"walkTime\": 1181,\n" +
        "        \"wheelchairNeed\": \"None\"\n" +
        "      },\n" +
        "      {\n" +
        "        \"accessibility\": \"None\",\n" +
        "        \"duration\": 3084,\n" +
        "        \"endTime\": 1773491573000,\n" +
        "        \"legs\": [\n" +
        "          {\n" +
        "            \"distance\": 1543,\n" +
        "            \"duration\": 1291,\n" +
        "            \"endTime\": 1773489780000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.74847784603872,\n" +
        "              \"lon\": 23.5675973072648,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 75,\n" +
        "              \"points\": \"}pi|Gm`znCc@X??mHlEsElBk@\\\\w@r@c@`@i@b@a@b@??oCvAKDYN??aB`@eBXqBFYAkAI??g@J??ML??O???IM??e@E??kBf@_A`@??ULe@ZsAhAmAv@SNcAh@??a@FsAIOA??OC??[C??MA??M???MA??_@A??_@G??UA??QEmAC???K??QMMg@??Ks@MkACSGe@Kw@G[\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773488489000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.76073150572846,\n" +
        "              \"lon\": 23.56443900614977,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          },\n" +
        "          {\n" +
        "            \"agencyId\": \"CLUJRO:2\",\n" +
        "            \"agencyName\": \"CTP Cluj\",\n" +
        "            \"agencyTimeZoneOffset\": 7200000,\n" +
        "            \"agencyUrl\": \"http://transitapp.com\",\n" +
        "            \"arrivalDelay\": 0,\n" +
        "            \"departureDelay\": 0,\n" +
        "            \"distance\": 5696.276667457071,\n" +
        "            \"duration\": 1740,\n" +
        "            \"endTime\": 1773491520000,\n" +
        "            \"from\": {\n" +
        "              \"globalStopId\": \"CLUJRO:299\",\n" +
        "              \"lat\": 46.76074540217097,\n" +
        "              \"lon\": 23.56443209754914,\n" +
        "              \"name\": \"Calea Mănăștur\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:5\",\n" +
        "              \"stopIndex\": 3,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"globalRouteId\": \"CLUJRO:331425\",\n" +
        "            \"headsign\": \"Disp. Unirii\",\n" +
        "            \"interlineWithPreviousLeg\": false,\n" +
        "            \"intermediateStops\": [\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:300\",\n" +
        "                \"lat\": 46.76258900885873,\n" +
        "                \"lon\": 23.57135686413243,\n" +
        "                \"name\": \"Agronomia\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:6\",\n" +
        "                \"stopIndex\": 4,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:301\",\n" +
        "                \"lat\": 46.76611434457386,\n" +
        "                \"lon\": 23.5796036316089,\n" +
        "                \"name\": \"Calea Moților\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:7\",\n" +
        "                \"stopIndex\": 5,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:302\",\n" +
        "                \"lat\": 46.76962169388229,\n" +
        "                \"lon\": 23.58712194961362,\n" +
        "                \"name\": \"Memorandumului Sud\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:8\",\n" +
        "                \"stopIndex\": 6,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:303\",\n" +
        "                \"lat\": 46.77166315104385,\n" +
        "                \"lon\": 23.59277867452387,\n" +
        "                \"name\": \"Victoria\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:9\",\n" +
        "                \"stopIndex\": 7,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:304\",\n" +
        "                \"lat\": 46.77297615873368,\n" +
        "                \"lon\": 23.59694252767721,\n" +
        "                \"name\": \"Regionala CFR\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:10\",\n" +
        "                \"stopIndex\": 8,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:305\",\n" +
        "                \"lat\": 46.77624069155151,\n" +
        "                \"lon\": 23.60628646596298,\n" +
        "                \"name\": \"Biserica Sf. Petru\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:168\",\n" +
        "                \"stopIndex\": 9,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:306\",\n" +
        "                \"lat\": 46.77757168564804,\n" +
        "                \"lon\": 23.61127769382496,\n" +
        "                \"name\": \"P-Ța Mărăști\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:169\",\n" +
        "                \"stopIndex\": 10,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:307\",\n" +
        "                \"lat\": 46.77839006715334,\n" +
        "                \"lon\": 23.61579228190914,\n" +
        "                \"name\": \"Mareșal C-Tin Prezan\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:170\",\n" +
        "                \"stopIndex\": 11,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:308\",\n" +
        "                \"lat\": 46.77787745456211,\n" +
        "                \"lon\": 23.61994714185911,\n" +
        "                \"name\": \"Dorobanților\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:171\",\n" +
        "                \"stopIndex\": 12,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              },\n" +
        "              {\n" +
        "                \"globalStopId\": \"CLUJRO:309\",\n" +
        "                \"lat\": 46.77410930235639,\n" +
        "                \"lon\": 23.62166484369991,\n" +
        "                \"name\": \"Campus Universitar Vest\",\n" +
        "                \"stopCode\": \"\",\n" +
        "                \"stopId\": \"CLUJRO:172\",\n" +
        "                \"stopIndex\": 13,\n" +
        "                \"vertexType\": \"TRANSIT\"\n" +
        "              }\n" +
        "            ],\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 83,\n" +
        "              \"points\": \"i~k|GglynCSkAQcAuAcGUuAqAcLq@iF_@wBmCyKEQ_@i@wAeB_@g@gAcBgAqBSy@o@eDsE{R_A{DaBaFFC_H_QaByDmAmDG_@_I}Uk@cAgAoFAU??eBoJABsBcLy@wDwFySwDyN}DcQMUg@uBQqACg@c@oCsCaL[kB}Ca[IU@_@Js@C_@MWKKIEUy@qAoMG]Q[MqAFu@b@gBVs@b@q@nA_AvI{CtEgB~C_AdA_@zAk@`@MlAy@TUb@q@^y@Lc@n@qAVUPEFQCYF[PcAz@{BLNZ{@\"\n" +
        "            },\n" +
        "            \"mode\": \"BUS\",\n" +
        "            \"realTime\": false,\n" +
        "            \"route\": \"24B\",\n" +
        "            \"routeColor\": \"d24cae\",\n" +
        "            \"routeId\": \"CLUJRO:13\",\n" +
        "            \"routeLongName\": \"Str. Unirii - Vivo Center\",\n" +
        "            \"routeShortName\": \"24B\",\n" +
        "            \"routeTextColor\": \"ffffff\",\n" +
        "            \"routeType\": 3,\n" +
        "            \"startTime\": 1773489780000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"globalStopId\": \"CLUJRO:310\",\n" +
        "              \"lat\": 46.77145630736669,\n" +
        "              \"lon\": 23.62520816582175,\n" +
        "              \"name\": \"Iulius Mall Vest\",\n" +
        "              \"stopCode\": \"\",\n" +
        "              \"stopId\": \"CLUJRO:173\",\n" +
        "              \"stopIndex\": 14,\n" +
        "              \"vertexType\": \"TRANSIT\"\n" +
        "            },\n" +
        "            \"transitLeg\": true,\n" +
        "            \"tripBlockId\": \"\",\n" +
        "            \"tripId\": \"CLUJRO:13_1_S_26_1355\",\n" +
        "            \"tripShortName\": \"\"\n" +
        "          },\n" +
        "          {\n" +
        "            \"distance\": 60,\n" +
        "            \"duration\": 53,\n" +
        "            \"endTime\": 1773491573000,\n" +
        "            \"from\": {\n" +
        "              \"lat\": 46.77147898678061,\n" +
        "              \"lon\": 23.62522792071104,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"legGeometry\": {\n" +
        "              \"length\": 11,\n" +
        "              \"points\": \"u`n|GsheoCGP??KQACIQ??FOFQ??Pc@\"\n" +
        "            },\n" +
        "            \"mode\": \"WALK\",\n" +
        "            \"startTime\": 1773491520000,\n" +
        "            \"steps\": [],\n" +
        "            \"to\": {\n" +
        "              \"lat\": 46.77146543837667,\n" +
        "              \"lon\": 23.62568456679583,\n" +
        "              \"name\": \"\",\n" +
        "              \"vertexType\": \"NORMAL\"\n" +
        "            },\n" +
        "            \"transitLeg\": false\n" +
        "          }\n" +
        "        ],\n" +
        "        \"startTime\": 1773488489000,\n" +
        "        \"transfers\": 0,\n" +
        "        \"transitTime\": 1740,\n" +
        "        \"walkTime\": 1344,\n" +
        "        \"wheelchairNeed\": \"None\"\n" +
        "      }\n" +
        "    ],\n" +
        "    \"to\": {\n" +
        "      \"lat\": 46.77147370855037,\n" +
        "      \"lon\": 23.62569363503033,\n" +
        "      \"name\": \"\",\n" +
        "      \"vertexType\": \"NORMAL\"\n" +
        "    }\n" +
        "  }\n" +
        "}"

    const getUserAddress = async () => {
        try {
            let latitude = parseFloat(searchParams.get("userLat"));
            let longitude = parseFloat(searchParams.get("userLng"));

            // If search params are not available, use browser geolocation
            if (isNaN(latitude) || isNaN(longitude)) {
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error('Geolocation not supported'));
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    });
                });
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
            }

            const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
            const data = await fetch(url, { headers: { "User-Agent": "Busify" } });
            const resp = await data.json();
            const address = resp.address;
            setOriginSearchValue(`${address.road || ""} ${address.house_number || ""}`);
            setOriginCoords({ lat: latitude, lon: longitude });
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

    const geocodeAddress = async (address) => {
        try {
            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&lat=46.7712&lon=23.6236&limit=1`;
            const data = await fetch(url);
            const result = await data.json();
            if (result.features && result.features.length > 0) {
                const [lon, lat] = result.features[0].geometry.coordinates;
                return { lat, lon };
            }
            return null;
        } catch (e) {
            console.error('Geocoding failed:', e);
            return null;
        }
    };

    const searchRoute = async (overrideOrigin, overrideDestination, overrideOriginCoords, overrideDestCoords) => {
        try {
            const origin = overrideOrigin ?? originSearchValue;
            const destination = overrideDestination ?? destinationSearchValue;
            let fromCoords = overrideOriginCoords ?? originCoords;
            let toCoords = overrideDestCoords ?? destinationCoords;

            if (!origin.trim() || !destination.trim()) return;

            setIsSearchingRoute(true);

            // Geocode addresses if coordinates are missing
            if (!fromCoords || !toCoords) {
                const [originResult, destResult] = await Promise.all([
                    !fromCoords ? geocodeAddress(origin) : Promise.resolve(fromCoords),
                    !toCoords ? geocodeAddress(destination) : Promise.resolve(toCoords)
                ]);

                fromCoords = originResult;
                toCoords = destResult;

                // Update state with the geocoded coordinates
                if (originResult && !originCoords) setOriginCoords(originResult);
                if (destResult && !destinationCoords) setDestinationCoords(destResult);

                if (!fromCoords || !toCoords) {
                    console.warn('Could not geocode addresses');
                    setIsSearchingRoute(false);
                    return;
                }
            }

            const updated = saveToHistory(origin, destination, fromCoords, toCoords);
            setRouteHistory(updated);

            // OTP API expects format: lat,lon
            const fromPlace = `${fromCoords.lat},${fromCoords.lon}`;
            const toPlace = `${toCoords.lat},${toCoords.lon}`;

            const f = await fetch(`https://busifyserver.onrender.com/otp?fromPlace=${fromPlace}&toPlace=${toPlace}`);
            const data = await f.json();
            const enriched = await enrichItineraries(data.plan.itineraries);
            setItineraries(enriched);
        } catch(e) {
            console.log(e)
        } finally {
            setIsSearchingRoute(false);
        }
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
        if (!originSearchValue) {
            setIsLoadingOriginSuggestions(false);
            return;
        }
        setIsLoadingOriginSuggestions(true);
        const timer = setTimeout(() => {
            getSuggestions(originSearchValue)
                .then(r => buildSuggestions(r))
                .then(suggestions => {
                    if (suggestions.length > 0) setOriginSuggestions(suggestions);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoadingOriginSuggestions(false));
        }, 1000);
        return () => clearTimeout(timer);
    }, [originSearchValue]);

    useEffect(() => {
        if (!destinationSearchValue) {
            setIsLoadingDestinationSuggestions(false);
            return;
        }
        setIsLoadingDestinationSuggestions(true);
        const timer = setTimeout(() => {
            getSuggestions(destinationSearchValue)
                .then(r => buildSuggestions(r))
                .then(suggestions => {
                    if (suggestions.length > 0) setDestinationSuggestions(suggestions);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoadingDestinationSuggestions(false));
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
                display: !localStorage.hasOwnProperty("active_subscription") ? "initial" : "none"
            }}>
                <div><b> Navighează ușor prin Cluj! </b></div>
                <div> Cu propriul nostru sistem de navigare te ducem acolo unde ai nevoie, când ai nevoie! </div>
                <Button style={{margin: '15px'}} onClick={() => {nav('/setari?abonare=true')}}><b>Devino abonat!</b></Button>
                <Button variant={'undefined'} style={{outline: 'solid 1px'}} onClick={() => {nav(-1)}} > Înapoi </Button>
            </div>
            <div style={{filter: !localStorage.hasOwnProperty("active_subscription") ? "blur(4px)" : "", pointerEvents: !localStorage.hasOwnProperty("active_subscription") ? "none" : "initial", userSelect: !localStorage.hasOwnProperty("active_subscription") ? "none" : "initial"}}>
            <div className="orare-content-header" style={{padding: "20px"}}>
                <BackButton style={{marginRight: "auto"}} onClick={() => {nav(-1)}}/>
                <h2 style={{marginBottom: '20px'}}><b>Direcții pas cu pas</b></h2>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", zIndex: 10, position: "relative" }}>
                    <Decoration style={{ flexShrink: 0, marginTop: "5px" }} />
                    <Form style={{ flex: 1 }}>
                        <form onSubmit={(e) => { e.preventDefault(); searchRoute(); }}>
                            <Form.Group style={{ display: "flex", flexDirection: "column", gap: "20px", margin: 0 }}>
                                <Dropdown show={(originSuggestions.length > 0 || isLoadingOriginSuggestions) && isOriginFocused} style={{zIndex: 1000, position: "relative"}}>
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
                                    <Dropdown.Menu style={{ width: "100%", zIndex: 1000 }}>
                                        {isLoadingOriginSuggestions && originSuggestions.length === 0 ? (
                                            <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
                                                <Spinner animation="border" size="sm" style={{ color: "#915FA8" }} />
                                            </div>
                                        ) : (
                                            originSuggestions.map((suggestion, index) => (
                                                <Dropdown.Item
                                                    key={index}
                                                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                                                    onClick={() => {
                                                        setOriginSearchValue(suggestion.name);
                                                        setOriginCoords({ lat: suggestion.lat, lon: suggestion.lon });
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
                                            ))
                                        )}
                                    </Dropdown.Menu>
                                </Dropdown>

                                <Dropdown show={(destinationSuggestions.length > 0 || isLoadingDestinationSuggestions) && isDestinationFocused} style={{zIndex: 100, position: "relative"}}>
                                    <Form.Control
                                        type="text"
                                        inputMode="search"
                                        placeholder="Destinație"
                                        value={destinationSearchValue}
                                        onFocus={() => setIsDestinationFocused(true)}
                                        onBlur={() => setTimeout(() => setIsDestinationFocused(false), 150)}
                                        onChange={(e) => setDestinationSearchValue(e.target.value)}
                                    />
                                    <Dropdown.Menu style={{ width: "100%", zIndex: 100 }}>
                                        {isLoadingDestinationSuggestions && destinationSuggestions.length === 0 ? (
                                            <div style={{ display: "flex", justifyContent: "center", padding: "10px" }}>
                                                <Spinner animation="border" size="sm" style={{ color: "#915FA8" }} />
                                            </div>
                                        ) : (
                                            destinationSuggestions.map((suggestion, index) => (
                                                <Dropdown.Item
                                                    key={index}
                                                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                                                    onClick={() => {
                                                        setDestinationSearchValue(suggestion.name);
                                                        setDestinationCoords({ lat: suggestion.lat, lon: suggestion.lon });
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
                                            ))
                                        )}
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Form.Group>
                        </form>
                    </Form>
                    <SwitchIcon style={{scale: "1.2", margin: "3px"}} onClick={() => {
                        const tempName = originSearchValue;
                        const tempCoords = originCoords;
                        setOriginSearchValue(destinationSearchValue);
                        setOriginCoords(destinationCoords);
                        setDestinationSearchValue(tempName);
                        setDestinationCoords(tempCoords);
                    }}/>
                </div>
                <Button
                    style={{ width: "100%", background: "white", boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px', marginTop: "20px", color: 'black', zIndex: '1'}}
                    variant='undefined'
                    onClick={() => searchRoute()}
                    disabled={isSearchingRoute}
                >
                    {isSearchingRoute ? (
                        <Spinner animation="border" size="sm" style={{ color: "#915FA8" }} />
                    ) : (
                        "Caută rută"
                    )}
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
                                        setOriginCoords(e.originCoords);
                                        setDestinationCoords(e.destinationCoords);
                                        searchRoute(e.origin, e.destination, e.originCoords, e.destinationCoords);
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
                                        nav('/', {
                                            state: {
                                                itinerary: it,
                                                origin: originSearchValue,
                                                destination: destinationSearchValue
                                            }
                                        });
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