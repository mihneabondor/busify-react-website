import './Orare.css'
import Form from 'react-bootstrap/Form';
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from "react-router-dom";
import {ReactComponent as OrarIcon} from '../Images/orarIcon.svg'
import Marker from '../OtherComponents/Marker'
import Anunt from "./Anunt";
import {useSheet} from "../Contexts/SheetContext";
import { useBusesBasic } from '../hooks/useApi';
import debounce from 'lodash.debounce';
import {ReactComponent as TrashIcon} from '../Images/favoriteTrashIcon.svg'
import {ReactComponent as BusIcon} from '../Images/busIcon.svg'
import {ReactComponent as TroleibusIcon} from '../Images/troleibusIcon.svg'
import {ReactComponent as TramvaiIcon} from '../Images/tramvaiIcon.svg'

function Orare() {
    const nav = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [activeFilter, setActiveFilter] = useState('toate');
    const {sheetOpen, setSheetOpen} = useSheet();

    // Use SWR for data fetching with automatic caching
    const { lines, isLoading, isError } = useBusesBasic();

    // Debounced search handler to prevent excessive filtering
    const debouncedSetSearch = useMemo(
        () => debounce((value) => setSearchValue(value), 150),
        []
    );

    // Memoize filtered lines to prevent recalculation on every render
    const filteredLines = useMemo(() => {
        if (!lines) return [];
        return lines.filter(line => {
            const matchesFilter = activeFilter.toLowerCase() === 'toate' ||
                                  activeFilter.toLowerCase() === line.type;
            const matchesSearch = searchValue === '' ||
                                  line.name.toLowerCase().includes(searchValue.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [lines, activeFilter, searchValue]);

    // Memoize navigation handler
    const handleLineClick = useCallback((lineName) => {
        setSheetOpen(false);
        nav(`/orare/${lineName}`);
    }, [nav, setSheetOpen]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="orare">
                <div className="orare-content-header">
                    <h2><b>Orare</b></h2>
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
        <div className="orare">
            <div className="orare-content-header">
                <h2><b>Orare</b></h2>
                <Anunt/>
                <Form style={{width: '90vw'}} onSubmit={(e) => {
                    e.preventDefault();
                    const matchingLine = lines.find(elem => elem.name.toLowerCase() === searchValue.toLowerCase());
                    if (matchingLine) {
                        setSheetOpen(false);
                        nav(`/orare/${matchingLine.name}`)
                    }
                    else
                        alert("Linie invalida")
                }}>
                    <Form.Group>
                        <Form.Control
                            type="Text"
                            placeholder="Caută o linie"
                            defaultValue={searchValue}
                            onChange={(e) => debouncedSetSearch(e.target.value)}
                        />
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
                {filteredLines.map((line) => (
                    <div
                        className='orare-cell'
                        key={line.name}
                        onClick={() => handleLineClick(line.name)}>
                        <Marker
                            type={line.type}
                            name={line.name}/>
                        <div> {line.route}</div>
                        <OrarIcon style={{marginLeft: 'auto'}}/>
                    </div>
                ))}
            </div>
            <br/> <br/> <br/>
        </div>
    )
}

export default Orare