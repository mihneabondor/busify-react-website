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
                        <img alt="" width='20px' height='20px' className='orare-filter-button-icon autobuz'
                             src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABzklEQVR4nO2ZvU7DMBRGDwws0IGIkQeAFQEDPzuwUPVZeAAkJCqExMA7MDF0aNjZ4BnKltIBBiZAFQiMjBIJVbFrl7h22nzSla3q6n732ImS1KDWMnAEtIAH4AX4BMSY4xXoANdAHZjBULPAMfDhoWlhEDFQMwE5D6BZMSSuhkGsAF8BNCoMYk0HcmFRaAs32jb0P9MVubcAcSlhELe6As8lAunoCvQtQHYcQewa+j/piogSRX9SQMTUgvSABhAxfkWpd88E5ADopvO8ZFnItxoaENn7fjbJfsxL9rETg4o0IHJMsokOJBQJDcjvvAIZs0S1I1T3iBOJ6tKiZJdWdwKeIwnp4z0pMUgC7JkmhyDx37ffiQGJ8K+lIkBCeI0/CeXDSv5fuzhCrAKXwHcRICGHUr4bExXIgHyvsKh2ZECqFWkDG8B8OsYOV7lt4aWUqnCeWo4gbLyUykteV+RuOgBZt/SyAlGd19UcgNQsvaZzR2JF7o0DkNjSywokM5CrspCOLiBG8VLq3WGDRcdbUYehvuNOB1IPoEFhGIc6EN19EloM1dSBuJIoyl91Xvc3Hp1hUJx/06DQqUOQZlH+c2mxvJWRKyGLyBxXGsn/B6l4OuxEhf6WAAAAAElFTkSuQmCC"/>
                        Autobuze
                    </div>
                    <div
                        className={activeFilter === 'troleibuze' ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                        onClick={() => {
                            setActiveFilter("troleibuze")
                        }}>
                        <img alt="" width='20px' height='20px' className='orare-filter-button-icon troleibuz'
                             src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB7ElEQVR4nO2aXUoDMRSFv4fiDqz9WYqCuAKruJD6g+2rVHQfiq5CEATfRF2DOn2uUqh9sJFAHsqQGZLJZJLqHLgvZc6599ybSTqdghsegHug4aAhuY/AHQHxDAig76DRVxpPBMQWsAC+gE4B/gYwUUZ2CIxbVchVAe614t4QAVqqq3Iy2xa8zaVpdqkATWAEvABT1cEqYqruQZl73dXEgeqYCByfwL6LiUUEJoSKnyJmmpFMQqRiYrvMRhEULTLizMbIq0Zgpg4vuUv5Rhs4VDnTdcgNwBi6ZeVyehfFkaYOWZsxdCOtYhK6k19XizGcyCVD1EZY8YnsAeOiZI8QGbXIWns6wnjpolUwIoAkj5BHjs2IyCPkkUNA1EaoJ+IF4t8urWQFjXzoCL2lfXkVjCTAblHyn/jS2KJ6dHwYkQ85VePEh5GZMiMfQ32jDRwD3z6MxBTGCF2oqI2kELrjop5ICrqOzIFTtbfLGKjPyuqyjb4xdGQpnMagRCM2+k5GdOdHq0QjNvpORnTvCLslGrHRdzKiG/3Q89Ia+jAyV8l83uyDKm72mMIYf8bIewTFiox4szFyHkHBIiPka0GrP7qISKOBJUpfr6HyJQai2p9jCsJbvksD4YsSjXjLt6bEdZ2SnZGi8pqy4JTvF+RlRZVR5d+zAAAAAElFTkSuQmCC"/>
                        Troleibuze
                    </div>
                    <div
                        className={activeFilter === 'tramvaie' ? 'orare-filter-button active-selection' : 'orare-filter-button'}
                        onClick={() => {
                            setActiveFilter("tramvaie")
                        }}>
                        <img alt="" width='20px' height='20px' className='orare-filter-button-icon tramvai'
                             src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAChUlEQVR4nO2aPWsVQRSGH7ULCAaM6A0IimgXrURzFRX0J1hpQPEj4g/wRm2sQizSSaxV0MYPUBuxU7ARRYKNSCKmkKiYC0Iwt4grB05kWOYm+3FmJ4F9YJqZ2ffMuzOzX2uhPBuAQ8B14AHwBpgEpoA5oKNlTusmtc994BrQVI2oXABmgKRkEY1zsUxcdQbyFZhIGTsK9Dr9e7VuaeDS93bqRLRiGPmuwYeB9U79U60f8hwzpG3SZwk59pLWzxKB18ArT/2oDmrM0zambaM59KJxWgf7zNP2XNtOsQbYp4Od9rR90ba9rELWAQPARWAceKmD/Qu0nY3c1rpE+4zrhh9QjSjIBj0B3HU2fZkyq1rHUxeOYMiN66yzREKUaeBMSEN7gPcBDaTLO2C3tYkjwO8KTSRaJOZhKxM7U5u26tIGdlgYuZcx4GAB7WZG7TsWRrJelYqSRfuHhZGsS2C16v8n1t5IaiNd8J2dh8A27GkAj6uckc2Eo69KI6FJaiPLUM9ICZJ6aS1DvbTWwtLqIxxbqjTyCOjHnn7gSf2stQKxn3qT+jE+ReyZSOoZSeE7O5KBuqLvDw3Na3QKnOU8OqXxifoSMq0CRvLolMYn6ns73FrASB6d0vhEZRn4bmZ5jeTRKU0n45IYMVpaI132Ummmugi3jDZ7Fp3PFkYmCgzQutyyMCKf9hcimvgD7MKIyxGNDGPMeWC+QgPzmh0LglwabwKLAQ0sagzfpdmMjc6fDQuaU7fipDPjL4BNBEIyVx810Ddgf6Ac/YzG+KR5S1OaTsLnA7CdcDSAtxrrF3DMSnjQuUnJV/gewtOjsSSmxD5oISoiP4EbFf+hILEkpsQ+sFLvf6fcs2hxhnn4AAAAAElFTkSuQmCC"/>
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