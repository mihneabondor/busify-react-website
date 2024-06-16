import MapNavbar from "../MapNavbar"
import './Orar.css'
import { useState, useEffect, useRef } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import OrarTable from './OrarTable';
import Button from 'react-bootstrap/Button';
import { useNavigate } from "react-router-dom";

function Orar(props) {
    const [page, setPage] = useState('lv');
    const orarFullRef = useRef();
    const [orar, setOrar] = useState();

    const nav = useNavigate();

    const fetchData = async () => {
        try {
            const url = 'https://orare.busify.ro/public/' + props.vehicle.name + '.json'
            const resp = await fetch(url)
            const data = await resp.json();
            orarFullRef.current = data;
            orarFullRef.current.station.d.lines = orarFullRef.current.station.d.lines.filter(elem => elem[0] || elem[1])
            orarFullRef.current.station.lv.lines = orarFullRef.current.station.lv.lines.filter(elem => elem[0] || elem[1])
            orarFullRef.current.station.s.lines = orarFullRef.current.station.s.lines.filter(elem => elem[0] || elem[1])

            const weekday = (new Date()).getDay();
            if (weekday === 0) {
                setPage('d')
                setOrar(orarFullRef.current.station.d)
            } else if (weekday === 6) {
                setPage('s')
                setOrar(orarFullRef.current.station.s)
            }
            else {
                setPage('lv')
                setOrar(orarFullRef.current.station.lv);
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])
    return (
        <div>
            <MapNavbar />
            <Button variant="outline-primary" style={{ margin: 10 }} onClick={() => nav(-1)}> {'< Inapoi'} </Button>
            <div className='orar-body'>
                <br />
                <h3>Orarul liniei {props.vehicle.name}</h3>
                <h4>{props.vehicle.route}</h4>
                <br />
                <div className='orar-container'>
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
                        <Tab eventKey="lv" title="Luni-vineri">
                            <OrarTable orar={orar} />
                        </Tab>
                        <Tab eventKey="s" title="Sambata">
                            <OrarTable orar={orar} />
                        </Tab>
                        <Tab eventKey="d" title="Duminica">
                            <OrarTable orar={orar} />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default Orar