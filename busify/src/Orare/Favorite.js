import './Orare.css'
import Form from 'react-bootstrap/Form';
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import BottomBar from '../OtherComponents/BottomBar';
import {ReactComponent as TrashIcon} from '../Images/favoriteTrashIcon.svg'
import {ReactComponent as BusIcon} from '../Images/busIcon.svg'
import {ReactComponent as TroleibusIcon} from '../Images/troleibusIcon.svg'
import {ReactComponent as TramvaiIcon} from '../Images/tramvaiIcon.svg'

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
            setLines(sol)
            linesRef.current = sol
            copie.current = sol

            const favoriteString = localStorage.getItem('linii_favorite')
            setFavorite(favoriteString.split(' '))
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
                <Form style={{width: '100%'}}>
                    <Form.Group>
                        <Form.Control type="Text" placeholder="Caută o linie" value={searchValue} onChange={(e) => {
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
                         style={{display: (activeFilter.toLowerCase() === line.type || activeFilter.toLowerCase() === "toate") && (searchValue === '' || line.name.includes(searchValue)) && favorite.includes(line.name) ? 'flex' : 'none'}}
                         onClick={() => {
                             let url = `/orare/${line.name}`
                             nav(url)
                         }}>
                        <div className={`orare-cell-badge ${line.type}`}>
                            <div className='orare-cell-badge-icon'>
                                {line.type === 'troleibuze' ?
                                    <TroleibusIcon/>
                                    : line.type === 'autobuze' ?
                                        <BusIcon/>
                                        : <TramvaiIcon/>}
                            </div>
                            <div className='orare-cell-badge-text'> {line.name} </div>
                        </div>
                        <div> {line.route}</div>
                        <TrashIcon style={{marginLeft: 'auto'}} onClick={(e)=>{
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