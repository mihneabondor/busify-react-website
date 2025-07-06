import './Orare.css'
import Form from 'react-bootstrap/Form';
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
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

    const fetchData = async () => {
        try {
            const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
            const buses_basic = await resp.json();
            const sol = []
            const joinArray = (arr) => {
                arr.forEach(elem => {
                    sol.push(elem)
                })
            }
            joinArray(buses_basic.urbane)
            joinArray(buses_basic.metropolitane)
            joinArray(buses_basic.market)
            linesRef.current = sol
            copie.current = sol

            const favoriteString = localStorage.getItem('linii_favorite')
            setFavorite(favoriteString.split(' '))

            for (const line of favoriteString.split(' ')) {
                if(line === ''){
                    continue;
                }
                const url = 'https://orare.busify.ro/public/' + line + '.json'
                const resp = await fetch(url)
                const data = await resp.json();
                const index = sol.findIndex(elem => elem.name === line);

                const dayType = (() => {
                    const day = new Date().getDay();
                    if (day === 0) return 'd'; // Sunday
                    if (day === 6) return 's'; // Saturday
                    return 'lv'; // Workdays
                })();

                // eslint-disable-next-line default-case
                switch (dayType) {
                    case 'lv':
                        sol[index].in_stop_name = data.station.lv.in_stop_name;
                        sol[index].out_stop_name = data.station.lv.out_stop_name;

                        sol[index].nextDepartureIn = getNextDepartureTime(data.station.lv.lines, "in")
                        sol[index].nextDepartureOut = getNextDepartureTime(data.station.lv.lines, "out")
                        break
                    case 's':
                        sol[index].in_stop_name = data.station.s.in_stop_name;
                        sol[index].out_stop_name = data.station.s.out_stop_name;

                        sol[index].nextDepartureIn = getNextDepartureTime(data.station.s.lines, "in")
                        sol[index].nextDepartureOut = getNextDepartureTime(data.station.s.lines, "out")
                        break
                    case 'd':
                        sol[index].in_stop_name = data.station.d.in_stop_name;
                        sol[index].out_stop_name = data.station.d.out_stop_name;

                        sol[index].nextDepartureIn = getNextDepartureTime(data.station.d.lines, "in")
                        sol[index].nextDepartureOut = getNextDepartureTime(data.station.d.lines, "out")
                        break
                }
            }

            setLines(sol)
        } catch (err) {
            console.log(err)
        }
    }

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
                         style={{display: (activeFilter.toLowerCase() === line.type || activeFilter.toLowerCase() === "toate") && (favorite.includes(line.name)) && (searchValue === '' || line.name.toLowerCase().includes(searchValue.toLowerCase())) ? 'flex' : 'none'}}
                         onClick={() => {
                             let url = `/favorite/${line.name}`
                             nav(url)
                         }}>
                        <Marker
                            type={line.type}
                            name={line.name}
                        />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, marginRight: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>{line.in_stop_name}</div>
                                <div><b>{line.nextDepartureIn}</b></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>{line.out_stop_name}</div>
                                <div><b>{line.nextDepartureOut}</b></div>
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

                            const favoriteNou = favorite.filter(item => item !== line.name);
                            setFavorite(favoriteNou);

                            setTimeout(() => {
                                localStorage.setItem('linii_favorite', favoriteNou.join(' '));
                            }, 0);
                        }}/>
                    </div>
                ))}
            </div>
            <BottomBar/>
            <br/> <br/> <br/>
        </div>
    )
}

export default Favorite