import Alert from 'react-bootstrap/Alert';
import { useState, useEffect } from 'react';
import {forEach} from "react-bootstrap/ElementChildren";

function Anunt(props) {
    const [anuntState, setAnunt] = useState([]);
    const [anuntOrarAziState, setAnuntOrarAzi] = useState([]);
    const [anuntOrarMaineState, setanuntOrarMaineState] = useState([]);

    const fetchData = async () => {
        try {
            const anuntData = await fetch('https://busifybackend-40a76006141a.herokuapp.com/anunturi');
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
        <Alert variant='danger' style={{display: anuntState.anunt ? 'initial' : 'none', ...props.style}}>
            {anuntState.anunt}
            <div> <br/> <p>Azi se circula conform orarului {anuntOrarAziState.orar ? `de ${anuntOrarAziState.orar}` : " obisnuit"}. Maine este valabil orarul {anuntOrarMaineState.orar ? `de ${anuntOrarMaineState.orar}` : "obisnuit"}. </p> </div>
            <hr/>
            <small>
                Conținut generat de AI, unele informații pot fi greșite. <a href={anuntState.link} target='_blank' style={{color: 'inherit'}}>Știre inițială</a>
            </small>
        </Alert>
    )
}

export default Anunt