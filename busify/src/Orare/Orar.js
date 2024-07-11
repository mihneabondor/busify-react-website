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
            setRoute(data.route);

        } catch (err) {
            console.log(err)
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
                <Button style={
                    {
                        backgroundColor: "purple",
                        borderColor: "purple",
                        margin: 10
                    }} onClick={() => {
                        if (!!nav.prevPage)
                            nav('/map')
                        else nav(-1)
                    }}> {'< Înapoi'} </Button>
            </div>
            <div className='orar-body'>
                <h3>Orarul liniei {linie}</h3>
                <h4>{route}</h4>
                <a href={'/map/'+ linie}>Vezi pe hartă </a>
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
                        <Tab eventKey="lv" title="Luni-vineri">
                            <OrarTable orar={orar} />
                        </Tab>
                        <Tab eventKey="s" title="Sâmbătă">
                            <OrarTable orar={orar} />
                        </Tab>
                        <Tab eventKey="d" title="Duminică">
                            <OrarTable orar={orar} />
                        </Tab>
                    </Tabs>
                </div>
                <Traseu />
            </div>
        </div>
    )
}

export default Orar