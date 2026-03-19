import './Orar.css'
import { useState, useEffect, useMemo } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import OrarTable from './OrarTable';
import {useNavigate, useSearchParams} from "react-router-dom";
import { useParams } from "react-router-dom";
import Traseu from "./Traseu";
import {ReactComponent as BackButton} from "../Images/backButton.svg";
import {ReactComponent as BusIcon} from "../Images/busIcon.svg";
import {ReactComponent as TroleibusIcon} from "../Images/troleibusIcon.svg";
import {ReactComponent as TramIcon} from "../Images/tramvaiIcon.svg";
import {ReactComponent as HeartIcon} from "../Images/heartIcon.svg";
import {ReactComponent as HeartIconFill} from "../Images/heartIconFill.svg";
import { useSchedule, useAnunturi } from '../hooks/useApi';

function Orar(props) {
    const [page, setPage] = useState('lv');
    const [orar, setOrar] = useState();
    const { linie } = useParams();
    const [searchParams] = useSearchParams();
    const [linieFav, setLinieFav] = useState(false);

    const nav = useNavigate();

    // Use SWR for data fetching with automatic caching
    const { schedule, isLoading: scheduleLoading, isError: scheduleError } = useSchedule(linie);
    const { anunturi, isLoading: anunturiLoading } = useAnunturi();

    // Process schedule data - filter empty lines
    const processedSchedule = useMemo(() => {
        if (!schedule) return null;

        const processed = { ...schedule };
        if (processed.station?.d)
            processed.station.d.lines = processed.station.d.lines.filter(elem => elem[0] || elem[1]);
        if (processed.station?.lv)
            processed.station.lv.lines = processed.station.lv.lines.filter(elem => elem[0] || elem[1]);
        if (processed.station?.s)
            processed.station.s.lines = processed.station.s.lines.filter(elem => elem[0] || elem[1]);

        return processed;
    }, [schedule]);

    // Determine correct schedule based on day and announcements
    useEffect(() => {
        if (!processedSchedule) return;

        let anuntOrar = '';

        // Check announcements for schedule overrides
        if (anunturi && anunturi.end_date) {
            const [day, month, year] = anunturi.end_date.split("/").map(Number);
            const endDate = new Date(year, month - 1, day);

            if (endDate >= new Date()) {
                anunturi.modificari?.forEach(elem => {
                    const dateParts = elem.zi.split('/');
                    const modDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                    const today = new Date();

                    if (modDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
                        if (elem.orar === 'sambata') {
                            anuntOrar = processedSchedule.station.s ? 's' : 'lv';
                        } else if (elem.orar === 'duminica') {
                            anuntOrar = processedSchedule.station.d ? 'd' : 'lv';
                        }
                    }
                });
            }
        }

        // Set schedule based on announcement or day of week
        if (anuntOrar) {
            setPage(anuntOrar);
            setOrar(processedSchedule.station[anuntOrar]);
        } else {
            const weekday = new Date().getDay();
            if (weekday === 0) {
                if (processedSchedule.station.d) {
                    setPage('d');
                    setOrar(processedSchedule.station.d);
                } else {
                    setPage('lv');
                    setOrar(processedSchedule.station.lv);
                }
            } else if (weekday === 6) {
                if (processedSchedule.station.s) {
                    setPage('s');
                    setOrar(processedSchedule.station.s);
                } else {
                    setPage('lv');
                    setOrar(processedSchedule.station.lv);
                }
            } else {
                setPage('lv');
                setOrar(processedSchedule.station.lv);
            }
        }
    }, [processedSchedule, anunturi]);

    // Check favorites on mount
    useEffect(() => {
        if (localStorage.getItem('linii_favorite')) {
            const favorite = localStorage.getItem('linii_favorite').split(' ');
            setLinieFav(favorite.includes(linie));
        }
    }, [linie]);

    const handleBackNavigation = () => {
        const id = searchParams.get('id');
        if (id) {
            nav(`/map/?id=${id}`);
        } else {
            nav(-1);
        }
    };

    // Derived values
    const type = processedSchedule?.type || "";
    const route = processedSchedule?.route;

    // Show loading state
    if (scheduleLoading) {
        return (
            <div className='orar-page-body'>
                <div className="orare-content-header">
                    <BackButton style={{marginRight: 'auto', display: window.history.length > 1 ? "initial" : 'none'}}
                                onClick={handleBackNavigation}/>
                    <h2 style={{textAlign: "center"}}><b>Linia {linie}</b></h2>
                </div>
                <div style={{display: 'flex', justifyContent: 'center', padding: '50px'}}>
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Se încarcă...</span>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className='orar-page-body'>
            <div className="orare-content-header">
                <BackButton style={{marginRight: 'auto', display: window.history.length > 1 ? "initial" : 'none'}}
                            onClick={handleBackNavigation}/>
                <div className='orar-title-label' style={{display: 'flex'}}>
                    {type === 'troleibuze' ?
                        <TroleibusIcon style={{marginRight: '5px', marginTop: "3px"}}/>
                        : type === 'autobuze' ? <BusIcon style={{marginRight: '5px', marginTop: "3px"}}/>
                            : <TramIcon style={{marginRight: '5px', marginTop: "3px"}}/>}
                    <h2 style={{alignItems: "center", textAlign: "center"}}><b>Linia {linie}</b></h2>
                </div>
                <h4 style={{textAlign: 'center'}}>{route}</h4>
                <div className="hr-like-div"/>
                <div className="orar-header-buttons" style={{paddingTop: linieFav ? "0" : "0px"}}>
                    <div className="orar-header-buttons-label" onClick={() => {
                        nav(`/map/${linie}`, {replace: false})
                    }}>
                        <img width="25" height="25" src="https://img.icons8.com/ios/50/marker--v1.png"
                             alt="marker--v1"/>
                        <div>Afișare pe hartă</div>
                    </div>

                    <div className="orar-header-buttons-label" onClick={() => {
                        setLinieFav(!linieFav);

                        let linii = localStorage.getItem('linii_favorite');
                        let favorites = linii ? linii.trim().split(/\s+/) : [];

                        const line = String(linie);

                        if (favorites.includes(line)) {
                            favorites = favorites.filter(l => l !== line);
                        } else {
                            favorites.push(line);
                        }

                        localStorage.setItem('linii_favorite', favorites.join(' '));
                    }}>
                        <HeartIcon style={{
                            minWidth: "30px",
                            minHeight: "30px",
                            marginRight: "5px",
                            display: linieFav ? "none" : "initial"
                        }}/>
                        <HeartIconFill style={{
                            minWidth: "30px",
                            minHeight: "30px",
                            marginRight: "5px",
                            display: linieFav ? "initial" : "none",
                            scale: 0.8
                        }}/>
                        <div>Linie favorită</div>
                    </div>

                </div>

            </div>
            {orar ? <div className='orar-body'>
                <div style={{boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px", borderRadius: "0 0 10px 10px"}}
                     className="mb-3 custom-tabs">
                    <Tabs
                        fill justify
                        className="orar-body-inner"
                        id="controlled-tab-example"
                        activeKey={page}
                        onSelect={(k) => {
                            if (k === 'lv')
                                setOrar(processedSchedule.station.lv)
                            else if (k === 's')
                                setOrar(processedSchedule.station.s)
                            else setOrar(processedSchedule.station.d)
                            setPage(k)
                        }}>
                        {processedSchedule && processedSchedule.station.lv ?
                            <Tab eventKey="lv" title="Luni-vineri">
                                <OrarTable orar={orar}/>
                            </Tab> : <div></div>}
                        {processedSchedule && processedSchedule.station.s ?
                            <Tab eventKey="s" title="Sâmbătă">
                                <OrarTable orar={orar}/>
                            </Tab> : <div></div>}
                        {processedSchedule && processedSchedule.station.d ?
                            <Tab eventKey="d" title="Duminică">
                                <OrarTable orar={orar}/>
                            </Tab> : <div></div>}
                    </Tabs>
                </div>
                <br/>
                <Traseu/>
            </div> : <div></div>}
            <br/> <br/> <br/>
        </div>
    )
}

export default Orar