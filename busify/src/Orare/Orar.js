import MapNavbar from "../MapNavbar"
import './Orar.css'
import { useState, useEffect, useRef } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import OrarTable from './OrarTable';
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";
import { useParams } from "react-router-dom";
import Traseu from "./Traseu";
import BottomBar from "../OtherComponents/BottomBar";
import {ReactComponent as BackButton} from "../Images/backButton.svg";
import {ReactComponent as BusIcon} from "../Images/busIcon.svg";
import {ReactComponent as TroleibusIcon} from "../Images/troleibusIcon.svg";
import {ReactComponent as TramIcon} from "../Images/tramvaiIcon.svg";
import {ReactComponent as HeartIcon} from "../Images/heartIcon.svg";
import {ReactComponent as HeartIconFill} from "../Images/heartIconFill.svg";

function Orar(props) {
    const [page, setPage] = useState('lv');
    const orarFullRef = useRef();
    const [orar, setOrar] = useState();
    const { linie } = useParams();
    const [searchParams] = useSearchParams();
    const [route, setRoute] = useState();
    const [linieFav, setLinieFav] = useState(false)
    const [type, setType] = useState("");

    const nav = useNavigate();

    const handleBackNavigation = () => {
        const id = searchParams.get('id');
        if (id) {
            nav(`/map/?id=${id}`);
        } else {
            nav(-1);
        }
    };

    const fetchData = async () => {
        try {
            const url = 'https://orare.busify.ro/public/' + linie + '.json'
            const resp = await fetch(url)
            const data = await resp.json();
            orarFullRef.current = data;
            setType(data.type)
            console.log(orarFullRef.current)
            if(orarFullRef.current.station.d)
                orarFullRef.current.station.d.lines = orarFullRef.current.station.d.lines.filter(elem => elem[0] || elem[1])
            if(orarFullRef.current.station.lv)
                orarFullRef.current.station.lv.lines = orarFullRef.current.station.lv.lines.filter(elem => elem[0] || elem[1])
            if(orarFullRef.current.station.s)
                orarFullRef.current.station.s.lines = orarFullRef.current.station.s.lines.filter(elem => elem[0] || elem[1])

            const anuntData = await fetch('https://busifyserver.onrender.com/anunturi');
            const anunt = await anuntData.json();
            const [day, month, year] = anunt.end_date.split("/").map(Number);
            const date = new Date(year, month - 1, day);
            let anuntOrar = '';
            console.log(date)
            if(date <= new Date()){
                anunt.modificari.forEach(elem => {
                    const dateParts = elem.zi.split('/')
                    const date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                    const today = new Date();
                    if(date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)){
                        if(elem.orar === 'sambata'){
                            if(orarFullRef.current.station.s){
                                anuntOrar = 's';
                                setOrar(orarFullRef.current.station.s)
                            } else {
                                anuntOrar = 'lv';
                                setOrar(orarFullRef.current.station.lv)
                            }
                        }
                        else if(elem.orar === 'duminica'){
                            console.log('intra')
                            if(orarFullRef.current.station.d){
                                anuntOrar = 'd';
                                setOrar(orarFullRef.current.station.d)
                            } else {
                                anuntOrar = 'lv';
                                setOrar(orarFullRef.current.station.lv)
                            }
                        }
                    }
                })
            }

            if(anuntOrar)
                setPage(anuntOrar);
            else {
                const weekday = (new Date()).getDay();
                if (weekday === 0) {
                    if(orarFullRef.current.station.d){
                        setPage('d')
                        setOrar(orarFullRef.current.station.d)
                    } else {
                        setPage('lv')
                        setOrar(orarFullRef.current.station.lv);
                    }
                } else if (weekday === 6) {
                    if(orarFullRef.current.station.s) {
                        setPage('s')
                        setOrar(orarFullRef.current.station.s);
                    } else {
                        setPage('lv')
                        setOrar(orarFullRef.current.station.lv);
                    }
                }
                else {
                    setPage('lv')
                    setOrar(orarFullRef.current.station.lv);
                }
            }
            setRoute(data.route);
        } catch (err) {
            console.log(err)
            const weekday = (new Date()).getDay();
            if (weekday === 0) {
                if(orarFullRef.current.station.d){
                    setPage('d')
                    setOrar(orarFullRef.current.station.d)
                } else {
                    setPage('lv')
                    setOrar(orarFullRef.current.station.lv);
                }
            } else if (weekday === 6) {
                if(orarFullRef.current.station.s) {
                    setPage('s')
                    setOrar(orarFullRef.current.station.s);
                } else {
                    setPage('lv')
                    setOrar(orarFullRef.current.station.lv);
                }
            }
            else {
                setPage('lv')
                setOrar(orarFullRef.current.station.lv);
            }
        }
    }
    useEffect(() => {
        fetchData()
        if(localStorage.getItem('linii_favorite')){
            const favorite = localStorage.getItem('linii_favorite').split(' ')
            console.log(linie)
            console.log(favorite.includes(linie))
            setLinieFav(favorite.includes(linie))
        }
    }, [])
    return (
        <div className='orar-page-body'>
            <div className="orare-content-header">
                <BackButton style={{marginRight: 'auto', display: window.history.length > 1 ? "inital" : 'none'}}
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
                                setOrar(orarFullRef.current.station.lv)
                            else if (k === 's')
                                setOrar(orarFullRef.current.station.s)
                            else setOrar(orarFullRef.current.station.d)
                            setPage(k)
                        }}>
                        {orarFullRef.current && orarFullRef.current.station.lv ?
                            <Tab eventKey="lv" title="Luni-vineri">
                                <OrarTable orar={orar}/>
                            </Tab> : <div></div>}
                        {orarFullRef.current && orarFullRef.current.station.s ?
                            <Tab eventKey="s" title="Sâmbătă">
                                <OrarTable orar={orar}/>
                            </Tab> : <div></div>}
                        {orarFullRef.current && orarFullRef.current.station.d ?
                            <Tab eventKey="d" title="Duminică">
                                <OrarTable orar={orar}/>
                            </Tab> : <div></div>}
                    </Tabs>
                </div>
                <br/>
                <Traseu/>
            </div> : <div></div>}
            <br/> <br/> <br/>
            <BottomBar/>
        </div>
    )
}

export default Orar