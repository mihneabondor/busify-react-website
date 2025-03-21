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
import { CiHeart } from "react-icons/ci";
import { FaHeart } from "react-icons/fa";

function Orar(props) {
    const [page, setPage] = useState('lv');
    const orarFullRef = useRef();
    const [orar, setOrar] = useState();
    const { linie } = useParams();
    const [route, setRoute] = useState();
    const [linieFav, setLinieFav] = useState(false)
    const [type, setType] = useState("");

    const nav = useNavigate();

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
            <div className="orare-content-header">
                <div className='orar-title-label'>
                    {type === 'troleibuze' ?
                        <img alt="" width='25px' height='25px'
                             src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB7ElEQVR4nO2aXUoDMRSFv4fiDqz9WYqCuAKruJD6g+2rVHQfiq5CEATfRF2DOn2uUqh9sJFAHsqQGZLJZJLqHLgvZc6599ybSTqdghsegHug4aAhuY/AHQHxDAig76DRVxpPBMQWsAC+gE4B/gYwUUZ2CIxbVchVAe614t4QAVqqq3Iy2xa8zaVpdqkATWAEvABT1cEqYqruQZl73dXEgeqYCByfwL6LiUUEJoSKnyJmmpFMQqRiYrvMRhEULTLizMbIq0Zgpg4vuUv5Rhs4VDnTdcgNwBi6ZeVyehfFkaYOWZsxdCOtYhK6k19XizGcyCVD1EZY8YnsAeOiZI8QGbXIWns6wnjpolUwIoAkj5BHjs2IyCPkkUNA1EaoJ+IF4t8urWQFjXzoCL2lfXkVjCTAblHyn/jS2KJ6dHwYkQ85VePEh5GZMiMfQ32jDRwD3z6MxBTGCF2oqI2kELrjop5ICrqOzIFTtbfLGKjPyuqyjb4xdGQpnMagRCM2+k5GdOdHq0QjNvpORnTvCLslGrHRdzKiG/3Q89Ia+jAyV8l83uyDKm72mMIYf8bIewTFiox4szFyHkHBIiPka0GrP7qISKOBJUpfr6HyJQai2p9jCsJbvksD4YsSjXjLt6bEdZ2SnZGi8pqy4JTvF+RlRZVR5d+zAAAAAElFTkSuQmCC"/>
                        : type === 'autobuze' ? <img alt="" width='25px' height='25px'
                                                          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABzklEQVR4nO2ZvU7DMBRGDwws0IGIkQeAFQEDPzuwUPVZeAAkJCqExMA7MDF0aNjZ4BnKltIBBiZAFQiMjBIJVbFrl7h22nzSla3q6n732ImS1KDWMnAEtIAH4AX4BMSY4xXoANdAHZjBULPAMfDhoWlhEDFQMwE5D6BZMSSuhkGsAF8BNCoMYk0HcmFRaAs32jb0P9MVubcAcSlhELe6As8lAunoCvQtQHYcQewa+j/piogSRX9SQMTUgvSABhAxfkWpd88E5ADopvO8ZFnItxoaENn7fjbJfsxL9rETg4o0IHJMsokOJBQJDcjvvAIZs0S1I1T3iBOJ6tKiZJdWdwKeIwnp4z0pMUgC7JkmhyDx37ffiQGJ8K+lIkBCeI0/CeXDSv5fuzhCrAKXwHcRICGHUr4bExXIgHyvsKh2ZECqFWkDG8B8OsYOV7lt4aWUqnCeWo4gbLyUykteV+RuOgBZt/SyAlGd19UcgNQsvaZzR2JF7o0DkNjSywokM5CrspCOLiBG8VLq3WGDRcdbUYehvuNOB1IPoEFhGIc6EN19EloM1dSBuJIoyl91Xvc3Hp1hUJx/06DQqUOQZlH+c2mxvJWRKyGLyBxXGsn/B6l4OuxEhf6WAAAAAElFTkSuQmCC"/>
                            : <img alt="" width='25px' height='25px'
                                   src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAChUlEQVR4nO2aPWsVQRSGH7ULCAaM6A0IimgXrURzFRX0J1hpQPEj4g/wRm2sQizSSaxV0MYPUBuxU7ARRYKNSCKmkKiYC0Iwt4grB05kWOYm+3FmJ4F9YJqZ2ffMuzOzX2ehPBuAQ8B14AHwBpgEpoA5oKNlTusmtc994BrQVI2oXABmgKRkEY1zsUxcdQbyFZhIGTsK9Dr9e7VuaeDS93bqRLRiGPmuwYeB9U79U60f8hwzpG3SZwk59pLWzxKB18ArT/2oDmrM0zambaM59KJxWgf7zNP2XNtOsQbYp4Od9rR90ba9rELWAQPARWAceKmD/Qu0nY3c1rpE+4zrhh9QjSjIBj0B3HU2fZkyq1rHUxeOYMiN66yzREKUaeBMSEN7gPcBDaTLO2C3tYkjwO8KTSRaJOZhKxM7U5u26tIGdlgYuZcx4GAB7WZG7TsWRrJelYqSRfuHhZGsS2C16v8n1t5IaiNd8J2dh8A27GkAj6uckc2Eo69KI6FJaiPLUM9ICZJ6aS1DvbTWwtLqIxxbqjTyCOjHnn7gSf2stQKxn3qT+jE+ReyZSOoZSeE7O5KBuqLvDw3Na3QKnOU8OqXxifoSMq0CRvLolMYn6ns73FrASB6d0vhEZRn4bmZ5jeTRKU0n45IYMVpaI132Ummmugi3jDZ7Fp3PFkYmCgzQutyyMCKf9hcimvgD7MKIyxGNDGPMeWC+QgPzmh0LglwabwKLAQ0sagzfpdmMjc6fDQuaU7fipDPjL4BNBEIyVx810Ddgf6Ac/YzG+KR5S1OaTsLnA7CdcDSAtxrrF3DMSnjQuUnJV/gewtOjsSSmxD5oISoiP4EbFf+hILEkpsQ+sFLvf6fcs2hxhnn4AAAAAElFTkSuQmCC"/>}
                    <h2><b>Linia {linie}</b></h2>
                </div>
                <h4 style={{textAlign: 'center'}}>{route}</h4>
                <div className="hr-like-div"/>
                <div className="orar-header-buttons" style={{paddingTop: linieFav ? "0" : "0px"}}>
                    <div className="orar-header-buttons-label">
                        <img width="25" height="25" src="https://img.icons8.com/ios/50/marker--v1.png"
                             alt="marker--v1"/>
                        <div>Afișare pe hartă</div>
                    </div>

                    <div className="orar-header-buttons-label" onClick={() => {
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
                    }}>
                        <CiHeart style={{minWidth: "30px", minHeight: "30px", marginRight: "5px", display: linieFav ? "initial" : "none"}}/>
                        <FaHeart style={{minWidth: "30px", minHeight: "30px", marginRight: "5px", display: linieFav ? "none" : "initial"}}/>
                        <div>Linie favorită</div>
                    </div>

                </div>
                {/*<br/>*/}

            </div>
            {/*<div className='orar-buttons'>*/}
            {/*    <br/>*/}
            {/*</div>*/}
            {orar ? <div className='orar-body'>
                <div style = {{boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px", borderRadius: "0 0 10px 10px"}} className="mb-3 custom-tabs">
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
                <br/>
                <Traseu/>
            </div> : <div></div>}
        </div>
    )
}

export default Orar