import Table from 'react-bootstrap/Table';
import { useEffect, useRef } from 'react';

function OrarTable(props) {
    let scrollToRef = useRef(null)
    let firstElemRef = useRef(null)

    function minutesUntilCurrentTime(timeString) {
        if (typeof (timeString) !== 'undefined') {
            timeString = timeString.replace('🚲', '')
            const [inputHours, inputMinutes] = timeString.split(':').map(Number);

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const currentDate = now.getDate();

            const inputTime = new Date(currentYear, currentMonth, currentDate, inputHours, inputMinutes);
            const diffMilliseconds = inputTime - now;
            const diffMinutes = Math.round(diffMilliseconds / (1000 * 60));

            return diffMinutes;
        }
        return 0;
    }

    function getFirstElemInSchedule() {
        for (let i = 0; i < props.orar.lines.length; i++)
            if (minutesUntilCurrentTime(props.orar.lines[i][0]) > 0 || minutesUntilCurrentTime(props.orar.lines[i][1]) > 0)
                return i - 1;
        return -1;
    }

    useEffect(() => {
        if (typeof (props.orar) !== 'undefined' && !firstElemRef.current) {
            firstElemRef.current = getFirstElemInSchedule();
            setTimeout(() => {
                if (scrollToRef.current) {
                    scrollToRef.current.scrollIntoView({ behavior: 'smooth', block: "start", inline: "nearest" });
                }
                console.log(scrollToRef.current)
            }, 500);
        }
    }, [props.orar])

    return (
        <div className='orar-table'>
            {typeof (props.orar) !== 'undefined' && firstElemRef.current !== null ?
                <Table striped bordered>
                    <thead>
                        <tr>
                            <th>{props.orar.in_stop_name}</th>
                            <th>{props.orar.out_stop_name}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.orar.lines.map((elem, index) => (
                            <tr key={index} ref={index === firstElemRef.current ? scrollToRef : null} >
                                <td style={{ color: minutesUntilCurrentTime(elem[0]) < 0 ? 'gray' : 'black', fontWeight: minutesUntilCurrentTime(elem[0]) <= 15 && minutesUntilCurrentTime(elem[0]) >= 0 ? 'bold' : 'initial' }}>{elem[0]}</td>
                                <td style={{ color: minutesUntilCurrentTime(elem[1]) < 0 ? 'gray' : 'black', fontWeight: minutesUntilCurrentTime(elem[1]) <= 15 && minutesUntilCurrentTime(elem[1]) >= 0 ? 'bold' : 'initial' }}>{elem[1]}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                : <div>Se incarca...</div>
            }
        </div>
    )
}

export default OrarTable