import MapNavbar from "../MapNavbar"
import './Orar.css'
import { useState, useEffect, useRef } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import OrarTable from './OrarTable';
import Button from 'react-bootstrap/Button';
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import Traseu from "./Traseu";
import Form from 'react-bootstrap/Form'
import Anunt from "./Anunt";
import anunt from "./Anunt";

function Orar(props) {
    const [page, setPage] = useState('lv');
    const orarFullRef = useRef();
    const [orar, setOrar] = useState();
    const { linie } = useParams();
    const [route, setRoute] = useState();
    const [linieFav, setLinieFav] = useState(false)

    const nav = useNavigate();

    const fetchData = async () => {
        try {
            const url = 'https://orare.busify.ro/public/' + linie + '.json'
            const resp = await fetch(url)
            const data = await resp.json();
            orarFullRef.current = data;
            console.log(orarFullRef.current)
            if(orarFullRef.current.station.d)
                orarFullRef.current.station.d.lines = orarFullRef.current.station.d.lines.filter(elem => elem[0] || elem[1])
            if(orarFullRef.current.station.lv)
                orarFullRef.current.station.lv.lines = orarFullRef.current.station.lv.lines.filter(elem => elem[0] || elem[1])
            if(orarFullRef.current.station.s)
                orarFullRef.current.station.s.lines = orarFullRef.current.station.s.lines.filter(elem => elem[0] || elem[1])

            const anuntData = await fetch('https://busifybackend-40a76006141a.herokuapp.com/anunturi');
            const anunt = await anuntData.json();
            const date = new Date(anunt.end_date);

            let anuntOrar = '';
            if(date > new Date()){
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
            setLinieFav(localStorage.getItem('linii_favorite').search(linie) !== -1)
            console.log(localStorage.getItem('linii_favorite').search(linie))
        }
    }, [])
    return (
        <div className='orar-page-body'>
            <MapNavbar />
            <div className='orar-buttons'>
                <br/>
            </div>
            <div className='orar-body'>
                <h3>Orarul liniei {linie}</h3>
                <h4>{route}</h4>
                <a href={'/map/'+ linie}>Vezi pe hartă </a>
                <a href={`sms:7479&body=${linie}`}> Bilet prin SMS </a>
                <Form.Switch
                    checked={linieFav}
                    id="custom-switch"
                    label= 'Linie favorită'
                    onChange={() => {
                        setLinieFav(!linieFav)
                        var linii = localStorage.getItem('linii_favorite');
                        if (!linii)
                            linii = '';
            
                        if (linii.search(linie) != -1) {
                            linii = linii.replace(linie + ' ', '')
                        } else {
                            linii += linie + ' ';
                        }
            
                        localStorage.setItem('linii_favorite', linii)
                    }}
                />
                <br />
                <Anunt style={{maxWidth: '80vw'}} />
                <br/>
                <div>
                    <Tabs
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
                            <OrarTable orar={orar} />
                        </Tab> : <div></div>}
                        {orarFullRef.current && orarFullRef.current.station.s ?
                        <Tab eventKey="s" title="Sâmbătă">
                            <OrarTable orar={orar} />
                        </Tab> : <div></div>}
                        {orarFullRef.current && orarFullRef.current.station.d ?
                        <Tab eventKey="d" title="Duminică">
                            <OrarTable orar={orar} />
                        </Tab> : <div></div>}
                    </Tabs>
                </div>
                <Traseu />
                <br/>
            </div>
        </div>
    )
}

export default Orar