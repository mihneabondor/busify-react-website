import './Orare.css'
import Form from 'react-bootstrap/Form';
import { useState, useMemo } from 'react'
import { useNavigate } from "react-router-dom";
import { ReactComponent as BusIcon } from '../Images/busIcon.svg'
import { ReactComponent as TroleibusIcon } from '../Images/troleibusIcon.svg'
import { ReactComponent as TramvaiIcon } from '../Images/tramvaiIcon.svg'
import Marker from "../OtherComponents/Marker";
import Anunt from "./Anunt";
import { useSheet } from "../Contexts/SheetContext";
import { useBusesBasic } from '../hooks/useApi';
import useSWR from 'swr';

// ─── pure helpers ────────────────────────────────────────────────────────────

function getDayType() {
    const day = new Date().getDay();
    if (day === 0) return 'd';
    if (day === 6) return 's';
    return 'lv';
}

function getNextDepartureTime(scheduleMatrix, direction) {
    const colIndex = direction === 'in' ? 0 : 1;
    const now = new Date();
    for (const row of scheduleMatrix) {
        const timeString = row[colIndex]?.replace('🚲', '');
        if (!timeString) continue;
        const [h, m] = timeString.split(':').map(Number);
        const departure = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        if (departure >= now) return timeString;
    }
    return '';
}

function minutesUntil(timeString) {
    if (!timeString) return 0;
    const clean = timeString.replace('🚲', '');
    const [h, m] = clean.split(':').map(Number);
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return Math.round((target - now) / 60000);
}

async function fetchFavoriteSchedules(favoriteList) {
    const dayType = getDayType();
    const results = await Promise.all(
        favoriteList.map(async (lineName) => {
            try {
                const resp = await fetch(`https://orare.busify.ro/public/${lineName}.json`);
                const data = await resp.json();
                const station = data.station[dayType];
                return {
                    name: lineName,
                    in_stop_name:     station.in_stop_name,
                    out_stop_name:    station.out_stop_name,
                    nextDepartureIn:  getNextDepartureTime(station.lines, 'in'),
                    nextDepartureOut: getNextDepartureTime(station.lines, 'out'),
                };
            } catch {
                return null;
            }
        })
    );
    return results.filter(Boolean);
}

// ─── component ───────────────────────────────────────────────────────────────

function Favorite() {
    const nav = useNavigate();
    const { setSheetOpen } = useSheet();
    const [searchValue, setSearchValue]   = useState('');
    const [activeFilter, setActiveFilter] = useState('toate');

    // Read favorites once on mount (localStorage is sync, no effect needed)
    const [favorite] = useState(() =>
        (localStorage.getItem('linii_favorite') || '').split(' ').filter(Boolean)
    );

    // Basic lines — cached via SWR, same as Orare
    const { lines: allLines, isLoading: linesLoading } = useBusesBasic();

    // Per-favourite schedules — parallel fetch, keyed by the favourite list
    const { data: schedules, isLoading: schedulesLoading } = useSWR(
        favorite.length > 0 ? ['favorite-schedules', ...favorite] : null,
        () => fetchFavoriteSchedules(favorite),
        { revalidateOnFocus: false }
    );

    // Merge schedule data into the base lines array
    const lines = useMemo(() => {
        if (!allLines) return [];
        return allLines.map(line => {
            const schedule = schedules?.find(s => s.name === line.name);
            return schedule ? { ...line, ...schedule } : line;
        });
    }, [allLines, schedules]);

    // Apply filter + search on top of the merged array
    const filteredLines = useMemo(() =>
            lines.filter(line =>
                favorite.includes(line.name) &&
                (activeFilter === 'toate' || activeFilter === line.type) &&
                (searchValue === '' || line.name.toLowerCase().includes(searchValue.toLowerCase()))
            ),
        [lines, favorite, activeFilter, searchValue]
    );

    // ── loading state ────────────────────────────────────────────────────────
    if (linesLoading) {
        return (
            <div className="orare">
                <div className="orare-content-header">
                    <h2><b>Linii favorite</b></h2>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Se încarcă...</span>
                    </div>
                </div>
            </div>
        );
    }

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="orare">
            <div className="orare-content-header">
                <h2><b>Linii favorite</b></h2>
                <Anunt />
                <Form
                    style={{ width: '90vw' }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (lines.find(l => l.name === searchValue) && favorite.includes(searchValue)) {
                            setSheetOpen(false);
                            nav(`/favorite/${searchValue}`);
                        } else {
                            alert('Linie invalida');
                        }
                    }}
                >
                    <Form.Group>
                        <Form.Control
                            type="Text"
                            placeholder="Caută o linie"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                        />
                    </Form.Group>
                </Form>
            </div>

            <div className="orare-body-container">
                <div className="orare-filter">
                    {[
                        { key: 'toate',      label: 'Toate',      Icon: null },
                        { key: 'autobuze',   label: 'Autobuze',   Icon: BusIcon },
                        { key: 'troleibuze', label: 'Troleibuze', Icon: TroleibusIcon },
                        { key: 'tramvaie',   label: 'Tramvaie',   Icon: TramvaiIcon },
                    ].map(({ key, label, Icon }) => (
                        <div
                            key={key}
                            className={activeFilter === key ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                            onClick={() => setActiveFilter(key)}
                        >
                            {Icon && <Icon style={{ margin: '5px' }} />}
                            {label}
                        </div>
                    ))}
                </div>

                {filteredLines.length === 0 ? (
                    <div style={{ margin: '20px' }}>
                        Nu ai nicio linie setată ca favorite, dar le poți seta din pagina de orare!
                    </div>
                ) : (
                    filteredLines.map((line) => (
                        <div
                            key={line.name}
                            className="orare-cell"
                            onClick={() => nav(`/favorite/${line.name}`)}
                        >
                            <Marker type={line.type} name={line.name} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginRight: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>{line.in_stop_name}</div>
                                    <div style={{ fontWeight: minutesUntil(line.nextDepartureIn) <= 15 ? 'bold' : 'initial' }}>
                                        {schedulesLoading ? '…' : line.nextDepartureIn}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>{line.out_stop_name}</div>
                                    <div style={{ fontWeight: minutesUntil(line.nextDepartureOut) <= 15 ? 'bold' : 'initial' }}>
                                        {schedulesLoading ? '…' : line.nextDepartureOut}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <br /><br /><br />
        </div>
    );
}

export default Favorite;