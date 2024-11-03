import Alert from 'react-bootstrap/Alert';
import { useState, useEffect } from 'react';

function Anunt(props) {
    const [anuntState, setAnunt] = useState([]);
    const [anuntOrarAziState,  setAnuntOrarAzi] = useState([]);

    const fetchData = async () => {
        try {
            const anuntData = await fetch('https://busifybackend-40a76006141a.herokuapp.com/anunturi');
            const anunt = await anuntData.json();

            const dateParts = anunt.end_date.split("/");
            const date = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);

            if(date.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0)){
                console.log(anunt)
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
        <Alert variant='danger' style={{display: anuntState.anunt ? 'initial' : 'none', ...props.style}}>
            {anuntState.anunt}
            {anuntOrarAziState.orar ? <div> <br/> <br/> <p>Azi se circulă conform orarului de <b>{anuntOrarAziState.orar === "duminica" ? "duminică" : anuntOrarAziState.orar === 'sambata' ? "sâmbătă" : '-'}</b>.</p> </div> : <></>}
            <hr/>
            <small>
                Conținut generat de AI, unele informații pot fi greșite. <a href={anuntState.link} target='_blank' style={{color: 'inherit'}}>Știre inițială</a>
            </small>
        </Alert>
    )
}

export default Anunt