import Alert from 'react-bootstrap/Alert';
import { useState, useEffect } from 'react';
import {forEach} from "react-bootstrap/ElementChildren";

function Anunt(props) {
    const [anunt, setAnunt] = useState(null);
    const [anuntOrarAziState, setAnuntOrarAzi] = useState(null);
    const [anuntOrarMaineState, setanuntOrarMaineState] = useState(null);

    function formatRomanianDate(dateString) {
        // Parse "dd/mm/yyyy"
        const [day, month, year] = dateString.split("/").map(Number);
        const date = new Date(year, month - 1, day); // JS months are 0-based

        // Format to Romanian: e.g., "30 mai"
        return new Intl.DateTimeFormat("ro-RO", {
            day: "numeric",
            month: "long"
        }).format(date);
    }

    const fetchData = async () => {
        try {
            const anuntData = await fetch('https://busifyserver.onrender.com/anunturi');
            const anunt = await anuntData.json();

            const endDateParts = anunt.end_date.split("/");
            const endDate = new Date(+endDateParts[2], endDateParts[1] - 1, +endDateParts[0]);

            const startDateParts = anunt.start_date.split("/");
            const startDate = new Date(+startDateParts[2], startDateParts[1] - 1, +startDateParts[0]);

            let tomorrowDate = new Date();
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);

            anunt.modificari.forEach(element => {
                const elementDateParts = element.zi.split("/");
                const elementDate = new Date(+elementDateParts[2], elementDateParts[1] - 1, +elementDateParts[0]);
                if(elementDate.setHours(0, 0, 0, 0) === tomorrowDate.setHours(0, 0, 0, 0)){
                    setanuntOrarMaineState(element)
                }
            })

            if(endDate.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0) && startDate.setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0)){
                console.log(anunt)
                setAnunt(anunt);
                anunt.modificari.forEach(elem => {
                    const dateParts = elem.zi.split('/')
                    const date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                    const today = new Date();
                    if(date.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)){
                        setAnuntOrarAzi(elem)
                        console.log('da')
                    }
                })
            }
        } catch { }
    }

    useEffect(() => {
        fetchData();
    }, [])

    return (
        <div>
            { anunt ?
                <div style={{background: 'white', width: '90vw', borderRadius: '5px', color: 'black', padding: '10px', marginBottom: '20px'}}>
                    <div style={{marginBottom: '10px'}}><b>Modificare program de transport în {anunt.start_date === anunt.end_date ? `${formatRomanianDate(anunt.start_date)}` : `perioada ${formatRomanianDate(anunt.start_date)} - ${formatRomanianDate(anunt.end_date)}`}</b></div>

                    <div style={{marginBottom: '10px'}}> {anunt.anunt} {anuntOrarAziState ? `Azi se circulă conform programului de ${anuntOrarAziState.orar}.` : null} {anuntOrarMaineState ? `Mâine se circulă conform programului de ${anuntOrarMaineState.orar}.` : null} </div>
                    <a href={anunt.link} target={'_blank'} style={{color: 'gray'}}><small>Citește articolul</small></a>
                </div>
                : null}
        </div>
    )
}

export default Anunt