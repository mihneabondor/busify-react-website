import './ClusterMarker.css';
import { useMemo } from "react";

/**
 * ClusterMarker renders horizontal pills showing line numbers
 * with a single arrow showing the general direction of travel
 */
function ClusterMarker({ vehicles, mapBearing = 0, iconite, sageti }) {
    const totalCount = vehicles.length;

    // Deduplicate vehicles by line name, keeping only unique lines
    const uniqueVehicles = useMemo(() => {
        const seen = new Set();
        return vehicles.filter(v => {
            if (seen.has(v.line)) return false;
            seen.add(v.line);
            return true;
        });
    }, [vehicles]);

    // Take up to 3 unique vehicles for the stack display
    const displayVehicles = uniqueVehicles.slice(0, 3);

    // Calculate average bearing for the cluster arrow
    const avgBearing = useMemo(() => {
        if (!vehicles.length) return 0;

        // Convert bearings to vectors, average them, then back to angle
        // This handles the 0/360 wraparound issue
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
    }, [vehicles]);

    // Get arrow image based on predominant vehicle type
    const getArrowImage = () => {
        // Count vehicle types
        const typeCounts = {};
        vehicles.forEach(v => {
            typeCounts[v.vehicleType] = (typeCounts[v.vehicleType] || 0) + 1;
        });

        // Find predominant type
        let predominantType = 'autobuze';
        let maxCount = 0;
        Object.entries(typeCounts).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                predominantType = type;
            }
        });

        switch (predominantType) {
            case 'troleibuze':
                return require('../Images/TroleibusArrowIcon.png');
            case 'tramvaie':
                return require('../Images/TramArrowIcon.png');
            default:
                return require('../Images/BusArrowIcon.png');
        }
    };

    // Calculate arrow position offset - positioned relative to the stack center
    const arrowPosition = useMemo(() => {
        const bearing = avgBearing;
        const baseDistance = iconite === "false" ? 30 : 35;
        const horizontalFactor = Math.abs(Math.cos(bearing * Math.PI / 180));
        const extraPadding = iconite === "false" ? 8 : 12;
        const dynamicDistance = baseDistance + extraPadding * (1 - horizontalFactor);

        const angleRad = bearing * Math.PI / 180;
        return {
            bearing,
            dx: dynamicDistance * Math.sin(angleRad),
            dy: -dynamicDistance * Math.cos(angleRad)
        };
    }, [avgBearing, iconite]);

    // Get direction label for accessibility
    const getDirectionLabel = () => {
        const bearing = avgBearing;
        if (bearing >= 315 || bearing < 45) return 'N';
        if (bearing >= 45 && bearing < 135) return 'E';
        if (bearing >= 135 && bearing < 225) return 'S';
        return 'W';
    };

    // Remaining vehicles count
    const remainingCount = totalCount - displayVehicles.length;

    return (
        <div className="cluster-marker-container">
            {/* Horizontal pills layout */}
            <div className="cluster-pills-row">
                {displayVehicles.map((vehicle, index) => (
                    <div
                        key={vehicle.label || index}
                        className={`cluster-pill ${vehicle.vehicleType}`}
                    >
                        {vehicle.line}
                    </div>
                ))}

                {/* Show count indicator if more vehicles than displayed */}
                {remainingCount > 0 && (
                    <div className="cluster-pill-count">
                        +{remainingCount}
                    </div>
                )}
            </div>

            {/* Direction arrow */}
            {sageti === "true" && (
                <div
                    className="cluster-arrow"
                    data-direction={getDirectionLabel()}
                    data-bearing={arrowPosition.bearing}
                    data-dx={arrowPosition.dx}
                    data-dy={arrowPosition.dy}
                    style={{
                        position: 'absolute',
                        left: `calc(50% + ${arrowPosition.dx}px - 20.5px)`,
                        top: `calc(50% + ${arrowPosition.dy}px - 20.5px)`,
                        transform: `rotate(${arrowPosition.bearing - (mapBearing || 0)}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.7s ease, top 0.7s ease, left 0.7s ease',
                        pointerEvents: 'none',
                        width: '41px',
                        height: '41px',
                    }}
                >
                    <img
                        src={getArrowImage()}
                        alt=""
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>
            )}
        </div>
    );
}

export default ClusterMarker;
