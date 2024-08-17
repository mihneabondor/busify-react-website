import Alert from 'react-bootstrap/Alert';
import { useState, useEffect } from 'react';

function Anunt() {
    const [anuntState, setAnunt] = useState([]);
    const [anuntOrarAziState,  setAnuntOrarAzi] = useState([]);

    const fetchData = async () => {
        try {
            const anuntData = await fetch('https://busifybackend-40a76006141a.herokuapp.com/anunturi');
            const anunt = await anuntData.json();
            const date = new Date(anunt.end_date);

            if(date > new Date()){
                setAnunt(anunt);
                anunt.modificari.forEach(elem => {
                    const date = new Date(elem.zi)
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
        <Alert variant='danger' style={{display: anuntState.anunt ? 'initial' : 'none', maxWidth: '80vw'}}>
            {anuntState.anunt}
            <br/> <br/>
            {anuntOrarAziState.orar ? <p>Azi se circula conform orarului de <b>{anuntOrarAziState.orar}</b>.</p> : <></>}
            <hr/>
            <small>
                Conținut generat de AI, unele informații pot fi greșite. <a href={anuntState.link} target='_blank' style={{color: 'inherit'}}>Știre inițială</a>
            </small>
        </Alert>
    )
}

export default Anunt