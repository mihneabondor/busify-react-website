import './Stiri.css'
import Card from 'react-bootstrap/Card';
import { useEffect, useRef, useState } from 'react';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';

function Stiri() {
    const [news, setNews] = useState([]);
    const newsRef = useRef();

    const fetchData = async () => {
        try {
            let resp = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.ctpcj.ro%2Findex.php%2Fro%2Fdespre-noi%2Fstiri%3Fformat%3Dfeed%26amp%3Btype%3Drss');
            let data = await resp.json();
            setNews(data.items)
            newsRef.current = data.items
        } catch (e) { console.log(e) }
    }

    useEffect(() => {
        fetchData();
    }, [])

    return (
        <div className='stiri-content'>
            <Row className="g-4 flex-nowrap" >
                {news.map((elem, idx) => (
                    <Col key={idx}>
                        <Card className='stiri-card'>
                            <Card.Body>
                                {/* <Card.Title>Card title</Card.Title> */}
                                <Card.Text>
                                    {elem.title}
                                </Card.Text>
                            </Card.Body>
                            <Card.Footer>
                                <small>
                                    <a href={elem.link} target="_blank">Citeste mai multe</a>
                                </small>
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
            {/* ))} */}
        </div>
    )
}

export default Stiri