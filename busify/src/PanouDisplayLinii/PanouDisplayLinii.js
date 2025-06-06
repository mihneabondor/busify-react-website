import '../Orare/Orare.css'
import Form from 'react-bootstrap/Form';
import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import BottomBar from '../OtherComponents/BottomBar';
import { ReactComponent as BusIcon } from '../Images/PanouLiniiBusIcon.svg'
import { ReactComponent as HeartIcon } from '../Images/PanouDisplayHeartIcon.svg'
import {ReactComponent as BackButton} from "../Images/backButton.svg";
import Marker from '../OtherComponents/Marker'
import CustomSwitch from "../OtherComponents/CustomSwitch";

function PanouDisplayLinii() {
    const [lines, setLines] = useState([]);
    const nav = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [checkedAll, setCheckedAll] = useState(false);
    const [checkedFav, setCheckedFav] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    const fetchData = async () => {
        try {
            const resp = await fetch('https://orare.busify.ro/public/buses_basic.json');
            const buses_basic = await resp.json();
            let sol = [];
            const joinArray = arr => arr.forEach(elem => sol.push(elem));
            joinArray(buses_basic.urbane);
            joinArray(buses_basic.metropolitane);
            joinArray(buses_basic.market);
            joinArray(buses_basic.noapte);

            const favorites = localStorage.getItem("linii_favorite")?.split(' ') || [];

            if (localStorage.hasOwnProperty('linii_selectate')) {
                const prefsArr = localStorage.getItem("linii_selectate").split(',');
                const preferences = {};
                for (let i = 0; i < prefsArr.length; i += 2) {
                    preferences[prefsArr[i]] = prefsArr[i + 1] === 'true';
                }

                sol = sol.map(elem => ({
                    ...elem,
                    favorite: favorites.includes(elem.name),
                    shown: preferences.hasOwnProperty(elem.name) ? preferences[elem.name] : false
                }));

                setCheckedAll(sol.every(line => line.shown));
                setCheckedFav(sol.filter(line => line.favorite).every(line => line.shown));
            } else {
                sol = sol.map(elem => ({
                    ...elem,
                    favorite: favorites.includes(elem.name),
                    shown: false
                }));
                setCheckedAll(false);
                setCheckedFav(false);
            }

            setLines(sol);
            setInitialLoad(false);  // ✅ Mark data as loaded
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchData()
    }, []);

    // Only update `linii_selectate`
    useEffect(() => {
        if (initialLoad) return; // ✅ prevent overwriting immediately on mount

        const prefsArr = [];
        lines.forEach(line => {
            prefsArr.push(line.name, String(line.shown));
        });
        localStorage.setItem("linii_selectate", prefsArr.join(','));

        setCheckedAll(lines.every(line => line.shown));
        setCheckedFav(lines.filter(line => line.favorite).every(line => line.shown));
    }, [lines, initialLoad]);

    const handleToggleLine = (lineName) => {
        setLines(prev =>
            prev.map(line =>
                line.name === lineName
                    ? { ...line, shown: !line.shown }
                    : line
            )
        );
    };

    const handleToggleAllFavorites = () => {
        const toggle = !checkedFav;
        const newLines = lines.map(line =>
            line.favorite ? { ...line, shown: toggle } : line
        );
        setLines(newLines);
        setCheckedFav(toggle);

        const prefsArr = [];
        newLines.forEach(line => {
            prefsArr.push(line.name, String(line.shown));
        });
        localStorage.setItem("linii_selectate", prefsArr.join(','));
    };


    const handleToggleAllLines = () => {
        const toggle = !checkedAll;
        const newLines = lines.map(line => ({ ...line, shown: toggle }));
        setLines(newLines);
        setCheckedAll(toggle);

        const prefsArr = [];
        newLines.forEach(line => {
            prefsArr.push(line.name, String(line.shown));
        });
        localStorage.setItem("linii_selectate", prefsArr.join(','));
    };


    return (
        <div className="orare">
            <div className="orare-content-header">
                <BackButton style={{marginRight: '75vw', display: window.history.length > 1 ? "inital" : 'none'}} onClick={() => {
                    if(!localStorage.hasOwnProperty("onboarding_done")) {
                        localStorage.setItem("onboarding_done", "true");
                        nav('/');
                    } else nav('/setari');
                }}/>
                <h2><b>Linii afișate pe hartă</b></h2>
                <br/>
                <Form style={{ width: '90vw' }}>
                    <Form.Group>
                        <Form.Control type="Text" placeholder="Caută o linie" value={searchValue} onChange={(e) => {
                            setSearchValue(e.target.value)
                        }} />
                    </Form.Group>
                </Form>
            </div>

            <div className='orare-body-container'>
                <div style={{ marginTop: '20px' }}>
                    <div className='orare-cell'>
                        <BusIcon style={{ marginRight: '10px' }} />
                        <div>Toate liniile</div>
                        <CustomSwitch
                            checked={checkedAll}
                            onChange={handleToggleAllLines}
                        />
                    </div>

                    <div className='orare-cell'>
                        <HeartIcon style={{ marginRight: '10px' }} />
                        <div>Liniile favorite</div>
                        <CustomSwitch
                            checked={checkedFav}
                            onChange={handleToggleAllFavorites}
                        />
                    </div>
                </div>

                {lines.map((line) => (
                    <div className='orare-cell'
                         key={line.name}
                         style={{ display: (searchValue === '' || line.name.includes(searchValue)) ? 'flex' : 'none' }}>
                        <Marker
                            type={line.type}
                            name={line.name} />
                        <div> {line.route}</div>
                        <CustomSwitch
                            checked={line.shown}
                            onChange={() => handleToggleLine(line.name)}
                        />
                    </div>
                ))}
            </div>
            {/*<BottomBar />*/}
            {/*<br /> <br /> <br />*/}
        </div>
    )
}

export default PanouDisplayLinii;