import Alert from 'react-bootstrap/Alert';
import { useState, useEffect } from 'react';

function Anunt(props) {
    const [anuntState, setAnunt] = useState([]);
    const [anuntOrarAziState,  setAnuntOrarAzi] = useState([]);

    const fetchData = async () => {
        try {
            const anuntData = await fetch('https://busifybackend-40a76006141a.herokuapp.com/anunturi');
            const anunt = await anuntData.json();

            const endDateParts = anunt.end_date.split("/");
            const endDate = new Date(+endDateParts[2], endDateParts[1] - 1, +endDateParts[0]);

            const startDateParts = anunt.start_date.split("/");
            const startDate = new Date(+startDateParts[2], startDateParts[1] - 1, +startDateParts[0]);

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
        <Alert variant='danger' style={{display: anuntState.anunt ? 'initial' : 'none', ...props.style}}>
            {anuntState.anunt}
            {anuntOrarAziState.orar ? <div> <br/> <p>Azi se circulă conform orarului de <b>{anuntOrarAziState.orar === "duminica" ? "duminică" : anuntOrarAziState.orar === 'sambata' ? "sâmbătă" : '-'}</b>.</p> </div> : <></>}
            <hr/>
            <small>
                Conținut generat de AI, unele informații pot fi greșite. <a href={anuntState.link} target='_blank' style={{color: 'inherit'}}>Știre inițială</a>
            </small>
        </Alert>
    )
}

export default Anunt