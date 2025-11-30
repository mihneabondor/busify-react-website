import './Orare.css'
import Form from 'react-bootstrap/Form';
import {useEffect, useRef, useState} from 'react'
import {useNavigate} from "react-router-dom";
import BottomBar from '../OtherComponents/BottomBar';
import {ReactComponent as TrashIcon} from '../Images/favoriteTrashIcon.svg'
import {ReactComponent as BusIcon} from '../Images/busIcon.svg'
import {ReactComponent as TroleibusIcon} from '../Images/troleibusIcon.svg'
import {ReactComponent as TramvaiIcon} from '../Images/tramvaiIcon.svg'
import Marker from "../OtherComponents/Marker";
import Anunt from "./Anunt";

function Favorite() {
    const searchValueRef = useRef();
    const [lines, setLines] = useState([]);
    const linesRef = useRef();
    const copie = useRef();
    const nav = useNavigate();
    const bottomRef = useRef()
    const [searchValue, setSearchValue] = useState('');

    const [activeFilter, setActiveFilter] = useState('toate');

    const [favorite, setFavorite] = useState([]);

    const search = (e) => {
        e.preventDefault();
        if (linesRef.current.find(elem => elem.name === searchValueRef.current.value.toUpperCase())) {
            let url = '/orare/' + searchValueRef.current.value.toUpperCase();
            console.log(url)
            nav(url);
        } else alert('Linia pe care ai introdus-o nu exista!')
    }

    function getNextDepartureTime(scheduleMatrix, direction) {
        const colIndex = direction === "in" ? 0 : 1;
        const now = new Date();

        for (let i = 0; i < scheduleMatrix.length; i++) {
            const timeString = scheduleMatrix[i][colIndex]?.replace('🚲', '');
            if (!timeString) continue;
            const [hours, minutes] = timeString.split(':').map(Number);
            const departure = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                hours,
                minutes
            );
            if (departure >= now) {
                return timeString;
            }
        }
        return ""; // No future departure found
    }

    function minutesUntilCurrentTime(timeString) {
        if (typeof (timeString) !== 'undefined') {
            timeString = timeString.replace('🚲', '')
            const [inputHours, inputMinutes] = timeString.split(':').map(Number);

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const currentDate = now.getDate();

            const inputTime = new Date(currentYear, currentMonth, currentDate, inputHours, inputMinutes);
            const diffMilliseconds = inputTime - now;
            const diffMinutes = Math.round(diffMilliseconds / (1000 * 60));

            return diffMinutes;
        }
        return 0;
    }

    const fetchData = async () => {
        try {
            const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
            const buses_basic = await resp.json();

            const sol = [];
            const joinArray = arr => sol.push(...arr);
            joinArray(buses_basic.urbane);
            joinArray(buses_basic.metropolitane);
            joinArray(buses_basic.market);

            linesRef.current = sol;
            copie.current = sol;

            const favoriteString = localStorage.getItem('linii_favorite') || '';
            const favoriteList = favoriteString.split(' ').filter(Boolean);
            setFavorite(favoriteList);

            // ✅ Show basic lines first
            setLines([...sol]);

            const dayType = (() => {
                const day = new Date().getDay();
                if (day === 0) return 'd'; // Sunday
                if (day === 6) return 's'; // Saturday
                return 'lv'; // Workdays
            })();

            const updates = await Promise.all(
                favoriteList.map(async (lineName) => {
                    try {
                        const url = `https://orare.busify.ro/public/${lineName}.json`;
                        const resp = await fetch(url);
                        const data = await resp.json();
                        const stationData = data.station[dayType];

                        return {
                            name: lineName,
                            in_stop_name: stationData.in_stop_name,
                            out_stop_name: stationData.out_stop_name,
                            nextDepartureIn: getNextDepartureTime(stationData.lines, "in"),
                            nextDepartureOut: getNextDepartureTime(stationData.lines, "out"),
                        };
                    } catch (error) {
                        console.warn(`Failed to load schedule for ${lineName}`, error);
                        return null;
                    }
                })
            );

            setLines(prevLines => {
                return prevLines.map(line => {
                    const update = updates.find(u => u && u.name === line.name);
                    return update
                        ? { ...line, ...update }
                        : line;
                });
            });

        } catch (err) {
            console.error('Error fetching lines:', err);
        }
    };


    const change = (e) => {
        linesRef.current = copie.current
        setLines(linesRef.current)
        if (searchValueRef.current.value !== '') {
            linesRef.current = linesRef.current.filter(elem => elem.name.includes(searchValueRef.current.value.toUpperCase()))
            setLines(linesRef.current)

            setTimeout(() => {
                searchValueRef.current.scrollIntoView({"block":"center"})
            }, 100);

        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="orare">
            <div className="orare-content-header">
                <h2><b>Linii favorite</b></h2>
                <Anunt/>
                <Form style={{width: '90vw'}} onSubmit={(e) =>{
                    e.preventDefault();
                    if(lines.filter(elem => elem.name === searchValue).length > 0 && localStorage.getItem('linii_favorite').split(" ").includes(`${searchValue}`))
                        nav(`/favorite/${searchValue}`)
                    else
                        alert("Linie invalida")
                }}>
                    <Form.Group>
                        <Form.Control type="Text" placeholder="Caută o linie" value={searchValue} onChange={(e) => {
                            console.log(lines.includes(e.target.value))
                            setSearchValue(e.target.value)
                        }}/>
                    </Form.Group>
                </Form>
            </div>

            <div className='orare-body-container'>
                <div className='orare-filter'>
                    <div
                        className={activeFilter === 'toate' ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                        onClick={() => {
                            setActiveFilter("toate")
                        }}>Toate
                    </div>
                    <div
                        className={activeFilter === 'autobuze' ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                        onClick={() => {
                            setActiveFilter("autobuze")
                        }}>
                        <BusIcon style={{margin: '5px'}}/>
                        Autobuze
                    </div>
                    <div
                        className={activeFilter === 'troleibuze' ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                        onClick={() => {
                            setActiveFilter("troleibuze")
                        }}>
                        <TroleibusIcon style={{margin: '5px'}}/>
                        Troleibuze
                    </div>
                    <div
                        className={activeFilter === 'tramvaie' ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                        onClick={() => {
                            setActiveFilter("tramvaie")
                        }}>
                        <TramvaiIcon style={{margin: '5px'}}/>
                        Tramvaie
                    </div>
                </div>
                {lines.map((line) => (
                    <div className='orare-cell'
                         style={{display: (activeFilter.toLowerCase() === line?.type || activeFilter.toLowerCase() === "toate") && (favorite.includes(line?.name)) && (searchValue === '' || line?.name.toLowerCase().includes(searchValue.toLowerCase())) ? 'flex' : 'none'}}
                         onClick={() => {
                             let url = `/favorite/${line?.name}`
                             nav(url)
                         }}>
                        <Marker
                            type={line?.type}
                            name={line?.name}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, marginRight: '10px' }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>{line?.in_stop_name}</div>
                                <div
                                    style={{fontWeight: minutesUntilCurrentTime(line?.nextDepartureIn) <= 15 ? "bold" : "initial"}}>{line?.nextDepartureIn}</div>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div>{line?.out_stop_name}</div>
                                <div style={{fontWeight: minutesUntilCurrentTime(line?.nextDepartureOut) <= 15 ? "bold" : "initial"}}>{line?.nextDepartureOut}</div>
                            </div>
                        </div>

                        <TrashIcon style={{
                            marginLeft: 'auto',
                            flexShrink: 0,
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            minHeight: 32
                        }} onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the parent onClick

                            const favoriteNou = favorite.filter(item => item !== line?.name);
                            setFavorite(favoriteNou);

                            setTimeout(() => {
                                localStorage.setItem('linii_favorite', favoriteNou.join(' '));
                            }, 0);
                        }}/>
                    </div>
                ))}

                {lines.filter(line => favorite.includes(line?.name)).length === 0 ? (
                    <div style={{margin: "20px"}}>Nu ai nicio linie setată ca favorite, dar le poți seta din pagina de orare!</div>
                ) : null}
            </div>
            <br/> <br/> <br/>
        </div>
    )
}

export default Favorite