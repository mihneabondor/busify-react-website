import '../Orare/Orare.css'
import '../Stiri/Stiri.css'
import {useEffect, useState} from "react";
import Form from "react-bootstrap/Form";
import BottomBar from "../OtherComponents/BottomBar";
import {ReactComponent as StireIcon} from '../Images/stireIcon.svg'
import Card from "react-bootstrap/Card";
import {ReactComponent as ArrowUpRight} from "../Images/arrow-up-right.svg";
import {useNavigate} from "react-router-dom";

function Stiri() {
    const [news, setNews] = useState([]);
    const [searchValue, setSearchValue] = useState('');

    const fetchData = async () => {
        try {
            console.log("intra")
            let resp = await fetch('https://busifyserver.onrender.com/stiri');
            let data = await resp.json();
            setNews(data)
            console.log(data)
        } catch (e) { console.log(e) }
    }

    function formatRomanianDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(date);
    }

    useEffect(() => {
        fetchData();
    }, [])

    return(
        <div className="stiri-container">
            <div className="orare-content-header">
                <h2><b>Știri</b></h2>
                <Form style={{width: '90vw'}}>
                    <Form.Group>
                        <Form.Control type="Text" placeholder="Caută articole de știri" value={searchValue}
                                      onChange={(e) => {
                                          setSearchValue(e.target.value)
                                      }}/>
                    </Form.Group>
                </Form>
            </div>

            <div className="stiri-body-container">
                <div className="stiri-body-container-label">
                    <StireIcon/>
                    <b style={{color: '#40464C', marginLeft: '5px'}}>Ultimele știri</b>
                </div>

                {news.map(elem => (
                    <Card className="text-white mt-3" style={{borderRadius: '10px', display: searchValue === '' || elem.title.toLowerCase().includes(searchValue.toLowerCase()) || elem.description.toLowerCase().includes(searchValue.toLowerCase()) ? 'flex' : 'none'}} onClick={()=>{window.open(elem.link)}}>
                        <Card.Img src={require(`../Images/ThumbnailsStiri/image${elem.thumbnail}.png`)} alt="Card image" style={{maxHeight: '25vh', objectFit: "cover", borderRadius: "10px 10px 0 0"}} />
                        <Card.ImgOverlay style={{background: "rgba(0, 0, 0, 0.5)",
                            backdropFilter: "blur(10px)",
                            height: "min-content",
                            overflow: "hidden"}}>
                            <div>
                                <Card.Text className="truncate"> {formatRomanianDate(elem.pubDate)} <br/> <b> {elem.title} </b> </Card.Text>
                            </div>
                        </Card.ImgOverlay>
                        <Card.Footer style={{color: "#40464C", display: 'flex', justifyContent: 'center', alignItems: 'center'}} onClick={() => window.location.href=elem.link} >
                            <b> Citește articolul </b>
                            <ArrowUpRight/>
                        </Card.Footer>
                    </Card>
                ))}
            </div>
            <br/>
            <small style={{color: 'gray'}}>📸 Barakat Maya</small>
            <br/><br/><br/>
            <BottomBar/>
        </div>
    )
}

export default Stiri