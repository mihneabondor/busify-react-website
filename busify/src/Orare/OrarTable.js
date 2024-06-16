import Table from 'react-bootstrap/Table';

function OrarTable(props) {
    function minutesUntilCurrentTime(timeString) {
        if (typeof (timeString) !== 'undefined') {
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

    return (
        <div className='orar-table'>
            {typeof (props.orar) !== 'undefined' ?
                <Table striped>
                    <thead>
                        <tr>
                            <th>{props.orar.in_stop_name}</th>
                            <th>{props.orar.out_stop_name}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {props.orar.lines.map((elem, index) => (
                            <tr ref={props.orar.lines[index]}>
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