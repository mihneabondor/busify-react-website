import Badge from "react-bootstrap/Badge";
import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router";
import {ReactComponent as VinereaVerdeIcon} from '../Images/VinereaVerdeIcon.svg';

function Badges() {
    const expandedLinesRef = useRef([])
    const vineriRef = useRef(false)
    const [anuntState, setAnunt] = useState([]);

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
    }, [])

    return (
        <div style={{display: 'flex', flexDirection: 'column', position: "absolute", zIndex: 100, margin: "10px"}}>
            <Badge style={{
                display: vineriRef.current ? "initial" : "none",
                marginBottom: 5,
                background: '#0CBE7E',
                padding: '10px',
                outline: '2px solid white'
            }} bg='undefined'>
                <div style={{display: 'flex', justifyContent: "center", alignItems: 'center', textAlign: 'center'}}>
                    <VinereaVerdeIcon
                        style={{
                            marginRight: 5,
                            scale: 2,
                        }}
                    />
                    Vinerea Verde
                </div>
            </Badge>
            <Badge style={{
                display: anuntState.anunt ? "initial" : "none",
                padding: '10px',
                outline: '2px solid white',
                background: '#E05757'
            }} bg='undefined' onClick={() => {
                nav('/orare')
            }}>Orar modificat</Badge>
        </div>
    )
}

export default Badges;