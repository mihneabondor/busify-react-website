import '../Orare/Orare.css'
import '../Stiri/Stiri.css'
import {useEffect, useState} from "react";
import Form from "react-bootstrap/Form";
import {ReactComponent as StireIcon} from '../Images/stireIcon.svg'
import Card from "react-bootstrap/Card";
import { IoNotificationsOutline, IoInformationCircle, IoWarning, IoAlertCircle, IoCheckmarkCircle, IoOpenOutline } from "react-icons/io5";
import {BottomSheet} from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css';
import CloseButton from "react-bootstrap/esm/CloseButton";

function Stiri() {
    const [news, setNews] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);

    const fetchData = async () => {
        try {
            console.log("intra")
            let resp = await fetch('https://busifyserver.onrender.com/stiri');
            let data = await resp.json();
            data = data.slice(0, 9);
            setNews(data)
            console.log(data)
        } catch (e) { console.log(e) }
    }

    function formatRomanianDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" }).format(date);
    }

    function formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Chiar acum';
        if (diffMins < 60) return `Acum ${diffMins} ${diffMins === 1 ? 'minut' : 'minute'}`;
        if (diffHours < 24) return `Acum ${diffHours} ${diffHours === 1 ? 'oră' : 'ore'}`;
        if (diffDays === 1) return 'Ieri';
        if (diffDays < 7) return `Acum ${diffDays} zile`;
        return formatRomanianDate(dateString);
    }

    function getNotificationIcon(type) {
        const iconStyle = { width: 24, height: 24, flexShrink: 0 };
        switch (type) {
            case 'info':
                return <IoInformationCircle style={{ ...iconStyle, color: '#3b82f6' }} />;
            case 'warning':
                return <IoWarning style={{ ...iconStyle, color: '#f59e0b' }} />;
            case 'alert':
                return <IoAlertCircle style={{ ...iconStyle, color: '#ef4444' }} />;
            case 'success':
            default:
                return <IoCheckmarkCircle style={{ ...iconStyle, color: '#10b981' }} />;
        }
    }

    useEffect(() => {
        fetchData();

        // Load saved notifications
        const savedNotifications = JSON.parse(localStorage.getItem('saved_notifications') || '[]');
        setNotifications(savedNotifications);

        // Mark all notifications as seen
        const seenIds = savedNotifications.map(n => n.id);
        localStorage.setItem('seen_notification_ids', JSON.stringify(seenIds));

        // Dispatch storage event so BottomBar can update the red dot
        window.dispatchEvent(new Event('storage'));
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
                    <IoNotificationsOutline style={{width: 20, height: 20}}/>
                    <b style={{color: '#40464C', marginLeft: '5px'}}>Notificări</b>
                </div>

                {notifications.length === 0 ? (
                    <p className="notificari-empty">Nu ai notificări</p>
                ) : (
                    notifications.map(notif => (
                        <div key={notif.id} className="notificare-card">
                            <div className="notificare-icon">
                                {getNotificationIcon(notif.type)}
                            </div>
                            <div className="notificare-content">
                                <b>{notif.title}</b>
                                <p>{notif.message}</p>
                                <small>{formatRelativeTime(notif.receivedAt)}</small>
                            </div>
                        </div>
                    ))
                )}

                {/* Știri section */}
                <div className="stiri-body-container-label" style={{marginTop: '24px'}}>
                    <StireIcon/>
                    <b style={{color: '#40464C', marginLeft: '5px'}}>Ultimele știri</b>
                </div>

                {news.map(elem => (
                    <Card key={elem.link} className="text-white mt-3" style={{
                        borderRadius: '10px',
                        display: searchValue === '' || elem.title.toLowerCase().includes(searchValue.toLowerCase()) || elem.description.toLowerCase().includes(searchValue.toLowerCase()) ? 'flex' : 'none'
                    }} onClick={() => setSelectedArticle(elem)}>
                        <Card.Img src={require(`../Images/ThumbnailsStiri/image${elem.thumbnail}.png`)}
                                  style={{maxHeight: '25vh', objectFit: "cover", borderRadius: "10px"}}/>
                        <Card.ImgOverlay style={{
                            background: "rgba(0, 0, 0, 0.5)",
                            backdropFilter: "blur(10px)",
                            height: "min-content",
                            overflow: "hidden"
                        }}>
                        <div style={{margin: '-5px'}}>
                                <Card.Text className="truncate"> {formatRomanianDate(elem.pubDate)} <br/>
                                    <b> {elem.title} </b> </Card.Text>
                            </div>
                        </Card.ImgOverlay>
                    </Card>
                ))}
            </div>
            <br/>
            <br/><br/><br/>

            <BottomSheet
                open={selectedArticle !== null}
                onDismiss={() => setSelectedArticle(null)}
                snapPoints={({ maxHeight }) => [maxHeight * 0.95]}
                header={
                    selectedArticle && (
                        <div className="stiri-sheet-header">
                            <div className="stiri-sheet-header-content">
                                <span className="stiri-modal-date">{formatRomanianDate(selectedArticle.pubDate)}</span>
                                <h3 className="stiri-modal-title">{selectedArticle.title}</h3>
                            </div>
                            <CloseButton onClick={() => setSelectedArticle(null)} />
                        </div>
                    )
                }
            >
                {selectedArticle && (
                    <div className="stiri-sheet-body">
                        <img
                            src={require(`../Images/ThumbnailsStiri/image${selectedArticle.thumbnail}.png`)}
                            alt={selectedArticle.title}
                            className="stiri-sheet-image"
                        />
                        <div
                            className="stiri-modal-body"
                            dangerouslySetInnerHTML={{
                                __html: selectedArticle.fullContent
                                    ? selectedArticle.fullContent.replace(/\n/g, '<br/>')
                                    : selectedArticle.content
                            }}
                        />
                        <button
                            className="stiri-modal-link"
                            onClick={() => window.open(selectedArticle.link)}
                        >
                            <IoOpenOutline size={18} />
                            Deschide în browser
                        </button>
                    </div>
                )}
            </BottomSheet>
        </div>
    )
}

export default Stiri
