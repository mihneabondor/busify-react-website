import Badge from "react-bootstrap/Badge";
import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {ReactComponent as VinereaVerdeIcon} from '../Images/VinereaVerdeIcon.svg';
import { IoWarning } from "react-icons/io5";

function Badges() {
    const expandedLinesRef = useRef([])
    const vineriRef = useRef(false)
    const [anuntState, setAnunt] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);

    const nav = useNavigate();

    const fetchData = async () => {
        try {
            const data = await fetch('https://orare.busify.ro/public/buses_basic.json')
            const resp = await data.json()
            resp.urbane.forEach(elem => expandedLinesRef.current.push(elem.name))
            resp.metropolitane.forEach(elem => expandedLinesRef.current.push(elem.name))
            resp.market.forEach(elem => expandedLinesRef.current.push(elem.name))

            const anuntData = await fetch('https://busifyserver.onrender.com/anunturi');
            const anunt = await anuntData.json();

            const endDateParts = anunt.end_date.split("/");
            const endDate = new Date(+endDateParts[2], endDateParts[1] - 1, +endDateParts[0]);

            const startDateParts = anunt.start_date.split("/");
            const startDate = new Date(+startDateParts[2], startDateParts[1] - 1, +startDateParts[0]);

            if(endDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && startDate.setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0))
                setAnunt(anunt);
        } catch (e) { console.log(e) }
    }

    function sortBusLines(busLines) {
        return busLines.sort((a, b) => {
            // Extract the numeric part and suffix using regex
            const parseLine = (line) => {
                const match = line.match(/^(\d+)([A-Z]*)$/);
                return [parseInt(match[1], 10), match[2] || ''];
            };

            const [numA, suffixA] = parseLine(a);
            const [numB, suffixB] = parseLine(b);

            // Compare numeric parts
            if (numA !== numB) {
                return numA - numB;
            }

            // Compare suffixes lexicographically
            return suffixA.localeCompare(suffixB);
        });
    }

    useEffect(() => {
        if (expandedLinesRef.current.length === 0)
            fetchData()
        const d = new Date();
        if(d.getDay() === 5)
            vineriRef.current = true

        // Auto-collapse badges after 3 seconds
        const timer = setTimeout(() => {
            setIsExpanded(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'row', position: "absolute", zIndex: 100, margin: "10px", gap: '8px'}}>
            <Badge style={{
                display: vineriRef.current ? "flex" : "none",
                justifyContent: 'center',
                alignItems: 'center',
                background: '#00A86B',
                padding: '10px 14px',
                outline: '2px solid white',
                borderRadius: '50px',
                transition: 'all 0.3s ease-in-out',
                cursor: 'pointer',
            }} bg='undefined' onClick={() => setIsExpanded(!isExpanded)}>
                <div style={{
                    display: 'flex',
                    justifyContent: "center",
                    alignItems: 'center',
                    textAlign: 'center',
                }}>
                    <VinereaVerdeIcon
                        style={{
                            scale: 2,
                            flexShrink: 0,
                        }}
                    />
                    <span style={{
                        marginLeft: isExpanded ? 10 : 0,
                        maxWidth: isExpanded ? '200px' : '0',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transition: 'max-width 0.3s ease-in-out, margin-left 0.3s ease-in-out, opacity 0.2s ease-in-out',
                        opacity: isExpanded ? 1 : 0,
                    }}>
                        Vinerea Verde
                    </span>
                </div>
            </Badge>
            <Badge style={{
                display: anuntState.anunt ? "flex" : "none",
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px 14px',
                outline: '2px solid white',
                background: '#E05757',
                borderRadius: '50px',
                transition: 'all 0.3s ease-in-out',
                cursor: 'pointer',
            }} bg='undefined' onClick={() => {
                if (!isExpanded) {
                    setIsExpanded(true);
                } else {
                    nav('/orare');
                }
            }}>
                <IoWarning style={{ fontSize: '18px', flexShrink: 0 }} />
                <span style={{
                    marginLeft: isExpanded ? 8 : 0,
                    maxWidth: isExpanded ? '200px' : '0',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'max-width 0.3s ease-in-out, margin-left 0.3s ease-in-out, opacity 0.2s ease-in-out',
                    opacity: isExpanded ? 1 : 0,
                }}>
                    Orar modificat
                </span>
            </Badge>
        </div>
    )
}

export default Badges;