import './ItinerarySheet.css';
import './VehicleHighlight.css';
import { BottomSheet } from 'react-spring-bottom-sheet';
import 'react-spring-bottom-sheet/dist/style.css';
import Marker from "./Marker";
import CloseButton from "react-bootstrap/esm/CloseButton";
import React, { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/esm/Button";
import { FaWalking } from "react-icons/fa";
import { MdDirectionsBus } from "react-icons/md";
import { ReactComponent as LocationIcon } from '../Images/locationIcon.svg';
import { ReactComponent as SpreIcon } from '../Images/SpreIcon.svg';
import { ReactComponent as DeLaIcon } from '../Images/DeLaIcon.svg';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import mapboxgl from 'mapbox-gl';

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

// Extract departure time from tripId (format: CLUJRO:{routeId}_{dir}_{sched}_{idx}_{HHMM})
// The last part is the time when the bus departs from the route's origin terminal
const extractTripDepartureTime = (tripId) => {
    if (!tripId) return null;
    const parts = tripId.split('_');
    if (parts.length < 5) return null;
    const timeStr = parts[parts.length - 1]; // e.g., "1350" for 13:50
    if (!/^\d{3,4}$/.test(timeStr)) return null;
    const padded = timeStr.padStart(4, '0');
    const hours = padded.slice(0, 2);
    const minutes = padded.slice(2, 4);
    return `${hours}:${minutes}`;
};

const vehicleTypeColors = {
    autobuze: '905EA8',
    microbuze: '905EA8',
    troleibuze: '2D8CFF',
    tramvaie: '0FBE7E',
};

const getRouteColor = (leg) => {
    if (leg.vehicleType && vehicleTypeColors[leg.vehicleType]) {
        return vehicleTypeColors[leg.vehicleType];
    }
    return leg.routeColor || '3c4e9a';
};

// ─── LegCard Component ───────────────────────────────────────────────────────

function LegCard({ leg, isActive, nextLeg, isLastLeg, destinationName }) {
    const isWalk = leg.mode === 'WALK';
    const walkMin = Math.round(leg.duration / 60);
    const walkMeters = Math.round(leg.distance);

    if (isWalk) {
        // Format distance nicely
        const distanceText = walkMeters >= 1000
            ? `${(walkMeters / 1000).toFixed(1)} km`
            : `${walkMeters} m`;

        // Get destination name: try leg.to.name, then next leg's boarding stop, then final destination
        let toName = leg.to.name;
        if (!toName && nextLeg?.from?.name) {
            toName = nextLeg.from.name; // Walking to a transit stop
        }
        if (!toName && isLastLeg && destinationName) {
            toName = destinationName; // Walking to final destination
        }
        if (!toName) {
            toName = 'destinație';
        }

        return (
            <div
                className={`itinerary-leg-card ${isActive ? 'active' : ''}`}
                style={{
                    background: isActive ? '#F5F6F8' : 'white',
                    border: isActive ? '2px solid #915FA8' : '1px solid RGB(208,215,227)',
                }}
            >
                <div className="leg-card-icon walk">
                    <FaWalking size={22} color="#666" />
                </div>
                <div className="leg-card-content">
                    <div className="leg-card-title">Mergi pe jos</div>
                    <div className="leg-card-subtitle">spre {toName}</div>
                    <div className="leg-card-meta">
                        <span className="leg-card-duration">{walkMin} min</span>
                        <span className="leg-card-distance">{distanceText}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (leg.transitLeg) {
        // Calculate stops count from stopIndex (more reliable than intermediateStops array)
        const fromStopIndex = leg.from?.stopIndex ?? 0;
        const toStopIndex = leg.to?.stopIndex ?? 0;
        const stopsCount = Math.abs(toStopIndex - fromStopIndex);
        const durationMin = Math.round(leg.duration / 60);
        const boardingTime = formatTime(leg.startTime);

        return (
            <div
                className={`itinerary-leg-card itinerary-leg-card-transit ${isActive ? 'active' : ''}`}
                style={{
                    background: isActive ? '#F5F6F8' : 'white',
                    border: isActive ? '2px solid #915FA8' : '1px solid RGB(208,215,227)',
                }}
            >
                <div className="leg-card-top-row">
                    <div className="leg-card-icon transit">
                        <Marker
                            type={leg.vehicleType}
                            name={leg.routeShortName}
                            minContent={true}
                        />
                    </div>
                    <div className="leg-card-content">
                        <div className="leg-card-title">
                            <span style={{ color: '#915FA8', fontWeight: 'bold', marginRight: '6px' }}>{boardingTime}</span>
                            {leg.from.name}
                        </div>
                        <div className="leg-card-subtitle">→ {leg.to.name}</div>
                    </div>
                </div>
                <div className="leg-card-meta-full">
                    <span className="leg-card-duration">{durationMin} min</span>
                    <span className="leg-card-stops">{stopsCount} stații</span>
                    <span className="leg-card-headsign">spre {leg.headsign}</span>
                </div>
            </div>
        );
    }

    return null;
}

// ─── ExpandedLegItem Component ───────────────────────────────────────────────

function ExpandedLegItem({ leg, index, totalLegs, isActive, nextLeg, isLastLeg, destinationName }) {
    const [showStops, setShowStops] = useState(false);
    const isWalk = leg.mode === 'WALK';
    const walkMin = Math.round(leg.duration / 60);
    const walkMeters = Math.round(leg.distance);

    if (isWalk) {
        // Get destination name: try leg.to.name, then next leg's boarding stop, then final destination
        let toName = leg.to.name;
        if (!toName && nextLeg?.from?.name) {
            toName = nextLeg.from.name;
        }
        if (!toName && isLastLeg && destinationName) {
            toName = destinationName;
        }
        if (!toName) {
            toName = 'destinație';
        }

        return (
            <div className={`expanded-leg-item ${isActive ? 'active' : ''}`}>
                <div className="expanded-leg-number">
                    <div className="leg-number-circle walk">
                        <FaWalking size={14} color="white" />
                    </div>
                    {index < totalLegs - 1 && <div className="leg-connector" />}
                </div>
                <div className="expanded-leg-content">
                    <div className="expanded-leg-header">
                        <span className="expanded-leg-title">Mergi pe jos spre {toName}</span>
                        <span className="expanded-leg-time">{walkMin} min</span>
                    </div>
                    <div className="expanded-leg-details">
                        <span>{walkMeters} m</span>
                    </div>
                </div>
            </div>
        );
    }

    if (leg.transitLeg) {
        const intermediateStops = leg.intermediateStops || [];
        const routeColor = getRouteColor(leg);
        // Calculate stops count from stopIndex (more reliable than intermediateStops array)
        const fromStopIndex = leg.from?.stopIndex ?? 0;
        const toStopIndex = leg.to?.stopIndex ?? 0;
        const stopsCount = Math.abs(toStopIndex - fromStopIndex);

        return (
            <div className={`expanded-leg-item ${isActive ? 'active' : ''}`}>
                <div className="expanded-leg-number">
                    <div
                        className="leg-number-circle transit"
                        style={{ background: `#${routeColor}` }}
                    >
                        <MdDirectionsBus size={14} color="white" />
                    </div>
                    {index < totalLegs - 1 && (
                        <div
                            className="leg-connector"
                            style={{ background: `#${routeColor}` }}
                        />
                    )}
                </div>
                <div className="expanded-leg-content">
                    <div className="expanded-leg-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Marker
                                type={leg.vehicleType}
                                name={leg.routeShortName}
                                minContent={true}
                            />
                            <span className="expanded-leg-title">spre {leg.headsign}</span>
                        </div>
                        <span className="expanded-leg-time">{Math.round(leg.duration / 60)} min</span>
                    </div>

                    <div className="expanded-leg-stations">
                        <div className="station-row boarding">
                            <DeLaIcon />
                            <span>Urcă la: <b>{leg.from.name}</b></span>
                            <span className="station-time">{formatTime(leg.startTime)}</span>
                        </div>

                        {stopsCount > 0 && (
                            <div
                                className="intermediate-stops-toggle"
                                onClick={() => setShowStops(!showStops)}
                            >
                                <span>{stopsCount} stații</span>
                                <span className="toggle-arrow">{showStops ? '▲' : '▼'}</span>
                            </div>
                        )}

                        {showStops && (
                            <div className="intermediate-stops-list">
                                {intermediateStops.map((stop, i) => (
                                    <div key={i} className="intermediate-stop">
                                        <div className="stop-dot" style={{ background: `#${routeColor}` }} />
                                        <span>{stop.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="station-row alighting">
                            <SpreIcon />
                            <span>Coboară la: <b>{leg.to.name}</b></span>
                            <span className="station-time">{formatTime(leg.endTime)}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// ─── Main Component ──────────────────────────────────────────────────────────

function ItinerarySheet({ itinerary, currentLegIndex = 0, onClose, map, origin, destination }) {
    const sheetRef = useRef(null);
    const [swiperInstance, setSwiperInstance] = useState(null);
    const [activeLegIndex, setActiveLegIndex] = useState(currentLegIndex);

    const { value: durationValue, unit: durationUnit } = formatDuration(itinerary.duration);
    const arrivalTime = formatTime(itinerary.endTime);

    // Slide to active leg when currentLegIndex prop changes
    useEffect(() => {
        setActiveLegIndex(currentLegIndex);
        if (swiperInstance && !swiperInstance.destroyed) {
            swiperInstance.slideTo(currentLegIndex);
        }
    }, [currentLegIndex, swiperInstance]);

    const handleSlideChange = (swiper) => {
        const newIndex = swiper.activeIndex;
        setActiveLegIndex(newIndex);
        handleFlyToLeg(itinerary.legs[newIndex]);
    };

    const handleFlyToLeg = (leg) => {
        if (!map?.current) return;

        sheetRef.current?.snapTo(({ headerHeight }) => headerHeight);

        // Create bounds that include both from and to points
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([leg.from.lon, leg.from.lat]);
        bounds.extend([leg.to.lon, leg.to.lat]);

        // Fit map to bounds with padding for better visibility
        map.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 250, left: 50, right: 50 },
            duration: 1000,
            maxZoom: 16
        });
    };

    return (
        <BottomSheet
            ref={sheetRef}
            open={true}
            expandOnContentDrag={false}
            scrollLocking={false}
            blocking={false}
            snapPoints={({ minHeight, headerHeight }) => [headerHeight, minHeight]}
            defaultSnap={({ headerHeight }) => headerHeight}
            header={
                <div className="itinerary-sheet-header">
                    {/* Header top row with color bar and close button */}
                    <div className="itinerary-header-top">
                        <div className="itinerary-color-bar">
                            {itinerary.legs.map((leg, i) => (
                                <div
                                    key={i}
                                    className={`color-bar-segment ${i === activeLegIndex ? 'active' : ''}`}
                                    style={{
                                        flex: leg.duration,
                                        background: leg.transitLeg
                                            ? `#${getRouteColor(leg)}`
                                            : 'RGB(208,215,227)'
                                    }}
                                />
                            ))}
                        </div>
                        <CloseButton onClick={onClose} />
                    </div>

                    {/* Header content */}
                    <div className="itinerary-header-content">

                        {/* Leg carousel with Swiper */}
                        <div className="itinerary-swiper-container">
                            <Swiper
                                onSwiper={setSwiperInstance}
                                onSlideChange={handleSlideChange}
                                slidesPerView="auto"
                                centeredSlides={true}
                                spaceBetween={10}
                                initialSlide={currentLegIndex}
                                className="itinerary-swiper"
                            >
                                {itinerary.legs.map((leg, i) => (
                                    <SwiperSlide key={i} style={{ width: 'auto' }}>
                                        <LegCard
                                            leg={leg}
                                            isActive={i === activeLegIndex}
                                            nextLeg={itinerary.legs[i + 1]}
                                            isLastLeg={i === itinerary.legs.length - 1}
                                            destinationName={destination}
                                        />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            }
        >
            <div className="itinerary-sheet-content">
                {/* Route summary */}
                <div className="itinerary-route-summary">
                    <div className="route-endpoint">
                        <DeLaIcon />
                        <span>De la: <b>{origin || itinerary.legs[0]?.from?.name || 'Start'}</b></span>
                    </div>
                    <div className="route-endpoint">
                        <SpreIcon />
                        <span>La: <b>{destination || itinerary.legs[itinerary.legs.length - 1]?.to?.name || 'Destinație'}</b></span>
                    </div>
                </div>

                {/* Full leg list */}
                <div className="itinerary-legs-list">
                    <div className="legs-list-header">
                        <b>Pașii călătoriei</b>
                    </div>
                    {itinerary.legs.map((leg, i) => (
                        <ExpandedLegItem
                            key={i}
                            leg={leg}
                            index={i}
                            totalLegs={itinerary.legs.length}
                            isActive={i === activeLegIndex}
                            nextLeg={itinerary.legs[i + 1]}
                            isLastLeg={i === itinerary.legs.length - 1}
                            destinationName={destination}
                        />
                    ))}
                </div>

                {/* Action buttons */}
                <div className="itinerary-actions">
                    <Button
                        variant="secondary"
                        className="itinerary-action-btn"
                        onClick={() => {
                            const activeLeg = itinerary.legs[activeLegIndex];
                            handleFlyToLeg(activeLeg);
                        }}
                    >
                        <LocationIcon style={{ filter: "brightness(0) saturate(100%)", marginRight: '5px' }} />
                        Centrează pe hartă
                    </Button>
                </div>

                <Button
                    className="itinerary-close-btn"
                    onClick={onClose}
                >
                    Închide navigarea
                </Button>
            </div>
        </BottomSheet>
    );
}

export default ItinerarySheet;
