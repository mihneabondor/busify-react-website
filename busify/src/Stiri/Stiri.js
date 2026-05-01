import '../Orare/Orare.css'
import '../Stiri/Stiri.css'
import {useEffect, useState} from "react";
import Form from "react-bootstrap/Form";
import {ReactComponent as StireIcon} from '../Images/stireIcon.svg'
import Card from "react-bootstrap/Card";
import { IoNotificationsOutline, IoInformationCircle, IoWarning, IoAlertCircle, IoCheckmarkCircle, IoOpenOutline, IoCalendarOutline, IoTimeOutline, IoLocationOutline, IoTicketOutline, IoCallOutline, IoMapOutline } from "react-icons/io5";
import {BottomSheet} from 'react-spring-bottom-sheet'
import 'react-spring-bottom-sheet/dist/style.css';
import CloseButton from "react-bootstrap/esm/CloseButton";

function Stiri() {
    const [news, setNews] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);

    // Events state
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dateFilter, setDateFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [locationSearch, setLocationSearch] = useState('');
    const [imageErrors, setImageErrors] = useState({});
    const [showAllEvents, setShowAllEvents] = useState(false);
    const [showAllNews, setShowAllNews] = useState(false);

    const fetchData = async () => {
        try {
            let resp = await fetch('https://busifyserver.onrender.com/stiri');
            let data = await resp.json();
            data = data.slice(0, 9);
            setNews(data)
        } catch (e) { console.log(e) }
    }

    const fetchEvents = async () => {
        try {
            const response = await fetch('/cluj-events-busify-7d.json');
            const data = await response.json();
            setEvents(data.events || []);
            setFilteredEvents(data.events || []);
        } catch (e) {
            console.error('Failed to fetch events:', e);
        }
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

    // Event utility functions
    function parseEventDate(dateString) {
        return new Date(dateString);
    }

    function formatEventDate(dateString) {
        const date = parseEventDate(dateString);
        return new Intl.DateTimeFormat("ro-RO", {
            day: "numeric",
            month: "long",
            weekday: 'short'
        }).format(date);
    }

    function formatEventTime(dateString) {
        const date = parseEventDate(dateString);
        return new Intl.DateTimeFormat("ro-RO", {
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function formatEventDay(dateString) {
        const date = parseEventDate(dateString);
        return new Intl.DateTimeFormat("ro-RO", {
            weekday: 'long'
        }).format(date);
    }

    function getPrimaryTags(event, limit = 3) {
        if (!event.tags) return [];
        const activity = event.tags.filter(t => t.axis === 'activity');
        const genre = event.tags.filter(t => t.axis === 'genre');
        const remaining = event.tags.filter(t => t.axis !== 'activity' && t.axis !== 'genre');
        return [...activity, ...genre, ...remaining].slice(0, limit);
    }

    function handleImageError(eventTitle) {
        setImageErrors(prev => ({ ...prev, [eventTitle]: true }));
    }

    function getEventImageSrc(event) {
        return imageErrors[event.title] ? null : event.image_url;
    }

    function getUniqueCategories(events) {
        const categoriesSet = new Set();
        events.forEach(event => {
            if (event.tags) {
                event.tags.forEach(tag => {
                    if (tag.axis === 'activity') {
                        categoriesSet.add(tag.slug);
                    }
                });
            }
        });
        return Array.from(categoriesSet);
    }

    // Filter functions
    function filterByDate(events, dateFilter) {
        const now = new Date();

        switch(dateFilter) {
            case 'today': {
                return events.filter(event => {
                    const eventDate = parseEventDate(event.starts_at);
                    return eventDate.toDateString() === now.toDateString();
                });
            }
            case 'this-week': {
                const weekFromNow = new Date(now);
                weekFromNow.setDate(now.getDate() + 7);
                return events.filter(event => {
                    const eventDate = parseEventDate(event.starts_at);
                    return eventDate >= now && eventDate <= weekFromNow;
                });
            }
            case 'all':
            default:
                return events;
        }
    }

    function filterByCategory(events, categoryFilter) {
        if (categoryFilter === 'all') {
            return events;
        }

        return events.filter(event => {
            return event.tags && event.tags.some(tag =>
                tag.axis === 'activity' && tag.slug === categoryFilter
            );
        });
    }

    function filterByLocation(events, searchQuery) {
        if (!searchQuery || searchQuery.trim() === '') {
            return events;
        }

        const query = searchQuery.toLowerCase().trim();

        return events.filter(event => {
            const placeName = event.place_name?.toLowerCase() || '';
            const location = event.location?.toLowerCase() || '';

            return placeName.includes(query) || location.includes(query);
        });
    }

    function getNotificationIcon(type) {
        const iconStyle = { width: 24, height: 24, flexShrink: 0 };
        switch (type) {
            case 'info':
                return <IoInformationCircle style={{ ...iconStyle, color: '#905EA8' }} />;
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
        fetchEvents();

        // Load saved notifications
        const savedNotifications = JSON.parse(localStorage.getItem('saved_notifications') || '[]');
        setNotifications(savedNotifications);

        // Mark all notifications as seen
        const seenIds = savedNotifications.map(n => n.id);
        localStorage.setItem('seen_notification_ids', JSON.stringify(seenIds));

        // Dispatch storage event so BottomBar can update the red dot
        window.dispatchEvent(new Event('storage'));
    }, [])

    // Check if event has passed
    function hasEventPassed(dateString) {
        const eventDate = parseEventDate(dateString);
        const now = new Date();
        return eventDate < now;
    }

    // Count today's events
    function getTodayEventsCount(events) {
        const now = new Date();
        return events.filter(event => {
            const eventDate = parseEventDate(event.starts_at);
            return eventDate.toDateString() === now.toDateString() && !hasEventPassed(event.starts_at);
        }).length;
    }

    // Combined filter effect for events
    useEffect(() => {
        let filtered = events;

        // Apply date filter
        filtered = filterByDate(filtered, dateFilter);

        // Apply category filter
        filtered = filterByCategory(filtered, categoryFilter);

        // Apply location search
        filtered = filterByLocation(filtered, locationSearch);

        // Sort: upcoming events first (by date), then past events last (by date descending)
        filtered = filtered.sort((a, b) => {
            const aDate = parseEventDate(a.starts_at);
            const bDate = parseEventDate(b.starts_at);
            const now = new Date();
            const aPassed = aDate < now;
            const bPassed = bDate < now;

            // If one has passed and the other hasn't, put the passed one last
            if (aPassed && !bPassed) return 1;
            if (!aPassed && bPassed) return -1;

            // If both passed or both upcoming, sort by date
            if (aPassed && bPassed) {
                return bDate - aDate; // Most recent passed events first
            } else {
                return aDate - bDate; // Soonest upcoming events first
            }
        });

        setFilteredEvents(filtered);
    }, [events, dateFilter, categoryFilter, locationSearch])

    
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
                {/*<div className="stiri-body-container-label" style={{justifyContent: "left"}}>*/}
                {/*    <IoNotificationsOutline style={{width: 20, height: 20}}/>*/}
                {/*    <b style={{color: '#40464C'}}>Notificări</b>*/}
                {/*</div>*/}

                {/*{notifications.length === 0 ? (*/}
                {/*    <p className="notificari-empty">Nu ai notificări</p>*/}
                {/*) : (*/}
                {/*    notifications.map(notif => (*/}
                {/*        <div key={notif.id} className="notificare-card">*/}
                {/*            <div className="notificare-icon">*/}
                {/*                {getNotificationIcon(notif.type)}*/}
                {/*            </div>*/}
                {/*            <div className="notificare-content">*/}
                {/*                <b>{notif.title}</b>*/}
                {/*                <p>{notif.message}</p>*/}
                {/*                <small>{formatRelativeTime(notif.receivedAt)}</small>*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    ))*/}
                {/*)}*/}

                {/* Evenimente section */}
                <div className="stiri-body-container-label" style={{justifyContent: 'left'}}>
                    <img src={require('../Images/Logo/bearmenu-logo.png')} alt={''} style={{width: 20, height: 20}}/>
                    <b style={{color: '#40464C', marginLeft: '5px'}}>Evenimente oferite de Bearmenu</b>
                </div>

                {/* Event Cards */}
                {filteredEvents.length === 0 ? (
                    <div className="events-empty-state">
                        <p>Nu am găsit evenimente cu filtrele selectate.</p>
                        <button
                            onClick={() => {
                                setDateFilter('all');
                                setCategoryFilter('all');
                                setLocationSearch('');
                            }}
                            className="reset-filters-btn"
                        >
                            Resetează filtrele
                        </button>
                    </div>
                ) : (
                    <>
                        {(showAllEvents ? filteredEvents : filteredEvents.slice(0, getTodayEventsCount(filteredEvents) >= 3 ? getTodayEventsCount(filteredEvents) : 5)).map((event, index) => (
                            <div key={`${event.title}-${index}`} className="event-card" style={{display: hasEventPassed(event.starts_at) ? "none" : "flex"}} onClick={() => setSelectedEvent(event)}>
                                {getEventImageSrc(event) ? (
                                    <img
                                        src={getEventImageSrc(event)}
                                        alt={event.title}
                                        className="event-card-image"
                                        onError={() => handleImageError(event.title)}
                                    />
                                ) : (
                                    <div className="event-card-image event-card-placeholder">
                                        <img src={require('../Images/Logo/bearmenu-logo.png')} alt="Bearmenu" />
                                    </div>
                                )}
                                <div className="event-card-overlay">
                                    <div className="event-card-title">
                                        {event.title}
                                    </div>
                                    <div className="event-card-meta">
                                        <span className="event-badge">
                                            <IoTimeOutline size={14} /> {formatEventDay(event.starts_at)}, {formatEventTime(event.starts_at)}
                                        </span>
                                        <span className="event-badge">
                                            <IoLocationOutline size={14} /> {event.place_name}
                                        </span>
                                    </div>
                                    <div className="event-tag-container">
                                        {getPrimaryTags(event, 3).map((tag, idx) => (
                                            <span key={idx} className="event-tag">{tag.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredEvents.length > 5 && (
                            <button
                                className="see-all-btn-bottom"
                                onClick={() => setShowAllEvents(!showAllEvents)}
                            >
                                {showAllEvents ? 'Arată mai puțin' : `Vezi toate`}
                            </button>
                        )}
                    </>
                )}

                {/* Știri section */}
                <div className="stiri-body-container-label" style={{marginTop: '24px', justifyContent: 'left'}}>
                    <StireIcon/>
                    <b style={{color: '#40464C', marginLeft: '5px'}}>Ultimele știri</b>
                </div>

                <>
                    {(showAllNews ? news : news.slice(0, 5)).map(elem => {
                        const shouldDisplay = searchValue === '' ||
                            elem.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                            elem.description.toLowerCase().includes(searchValue.toLowerCase());

                        if (!shouldDisplay) return null;

                        return (
                            <div key={elem.link} className="news-card" onClick={() => setSelectedArticle(elem)}>
                                <img
                                    src={require(`../Images/ThumbnailsStiri/image${elem.thumbnail}.png`)}
                                    alt={elem.title}
                                    className="news-card-image"
                                />
                                <div className="news-card-overlay">
                                    <div className="news-card-date">{formatRomanianDate(elem.pubDate)}</div>
                                    <div className="news-card-title">{elem.title.charAt(0).toUpperCase() + elem.title.slice(1).toLowerCase()}</div>
                                </div>
                            </div>
                        );
                    })}

                    {news.length > 5 && (
                        <button
                            className="see-all-btn-bottom"
                            onClick={() => setShowAllNews(!showAllNews)}
                        >
                            {showAllNews ? 'Arată mai puțin' : `Vezi toate`}
                        </button>
                    )}
                </>
            </div>
            <br/>
            <br/><br/><br/>

            {/* Event Detail Modal */}
            <BottomSheet
                open={selectedEvent !== null}
                onDismiss={() => setSelectedEvent(null)}
                snapPoints={({ maxHeight }) => [maxHeight * 0.95]}
                header={
                    selectedEvent && (
                        <div className="event-sheet-header">
                            <div className="event-sheet-header-content">
                                <span className="event-modal-date">{formatEventDay(selectedEvent.starts_at)}, {formatEventTime(selectedEvent.starts_at)}</span>
                                <h3 className="event-modal-title">{selectedEvent.title}</h3>
                            </div>
                            <CloseButton onClick={() => setSelectedEvent(null)} />
                        </div>
                    )
                }
            >
                {selectedEvent && (
                    <div className="event-sheet-body">
                        {getEventImageSrc(selectedEvent) &&
                            <img
                            src={getEventImageSrc(selectedEvent)}
                            alt={selectedEvent.title}
                            className="event-sheet-image"
                            onError={() => handleImageError(selectedEvent.title)}
                        />}

                        {/* Event Info Cards */}
                        <div className="event-info-grid">
                            <div className="event-info-card">
                                <IoTimeOutline size={20} color="#905EA8" />
                                <div>
                                    <div className="event-info-label">Început</div>
                                    <div className="event-info-value">
                                        {formatEventTime(selectedEvent.starts_at)}
                                    </div>
                                </div>
                            </div>

                            <div className="event-info-card">
                                <IoLocationOutline size={20} color="#905EA8" />
                                <div>
                                    <div className="event-info-label">Locație</div>
                                    <div className="event-info-value">
                                        {selectedEvent.place_name}
                                    </div>
                                </div>
                            </div>

                            {selectedEvent.entry_fee && (
                                <div className="event-info-card">
                                    <IoTicketOutline size={20} color="#905EA8" />
                                    <div>
                                        <div className="event-info-label">Intrare</div>
                                        <div className="event-info-value">
                                            {selectedEvent.entry_fee === 'free' ? 'Gratis' : selectedEvent.entry_fee}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="event-modal-section">
                            <h4>Despre eveniment</h4>
                            <p>{selectedEvent.description}</p>
                        </div>

                        {/* Tags */}
                        {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                            <div className="event-modal-section">
                                <h4>Categorii</h4>
                                <div className="event-tags-list">
                                    {selectedEvent.tags.map((tag, idx) => (
                                        <span key={idx} className="event-tag-modal">
                                            {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="event-modal-actions">
                            {selectedEvent.tickets && (
                                <button
                                    className="event-action-btn primary"
                                    onClick={() => window.open(selectedEvent.tickets)}
                                >
                                    <IoTicketOutline size={18} />
                                    Cumpără bilete
                                </button>
                            )}
                            {selectedEvent.bookings && (
                                <button
                                    className="event-action-btn secondary"
                                    onClick={() => window.open(`tel:${selectedEvent.bookings}`)}
                                >
                                    <IoCallOutline size={18} />
                                    Rezervări: {selectedEvent.bookings}
                                </button>
                            )}
                            <button
                                className="event-action-btn secondary"
                                onClick={() => window.open(`https://bear.menu/ro/cluj-napoca/events`)}
                            >
                                <img src={require('../Images/Logo/bearmenu-logo.png')} style={{width: "25px", height: "25px"}} />
                                Vezi pe Bearmenu
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* News Article Modal */}
            <BottomSheet
                open={selectedArticle !== null}
                onDismiss={() => setSelectedArticle(null)}
                snapPoints={({ maxHeight }) => [maxHeight * 0.95]}
                header={
                    selectedArticle && (
                        <div className="event-sheet-header">
                            <div className="event-sheet-header-content">
                                <span className="event-modal-date">{formatRomanianDate(selectedArticle.pubDate)}</span>
                                <h3 className="event-modal-title">{selectedArticle.title}</h3>
                            </div>
                            <CloseButton onClick={() => setSelectedArticle(null)} />
                        </div>
                    )
                }
            >
                {selectedArticle && (
                    <div className="event-sheet-body">
                        <img
                            src={require(`../Images/ThumbnailsStiri/image${selectedArticle.thumbnail}.png`)}
                            alt={selectedArticle.title}
                            className="event-sheet-image"
                        />

                        {/*/!* Article Info *!/*/}
                        {/*<div className="event-info-grid">*/}
                        {/*    <div className="event-info-card">*/}
                        {/*        <IoCalendarOutline size={20} color="#905EA8" />*/}
                        {/*        <div>*/}
                        {/*            <div className="event-info-label">Publicat</div>*/}
                        {/*            <div className="event-info-value">*/}
                        {/*                {formatRomanianDate(selectedArticle.pubDate)}*/}
                        {/*            </div>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Article Content */}
                        <div className="event-modal-section">
                            <h4>Articol</h4>
                            <div
                                className="news-modal-content"
                                dangerouslySetInnerHTML={{
                                    __html: selectedArticle.fullContent
                                        ? selectedArticle.fullContent.replace(/\n/g, '<br/>')
                                        : selectedArticle.content
                                }}
                            />
                        </div>

                        {/* Action Button */}
                        <div className="event-modal-actions">
                            <button
                                className="event-action-btn primary"
                                onClick={() => window.open(selectedArticle.link)}
                            >
                                <IoOpenOutline size={18} />
                                Deschide în browser
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </div>
    )
}

export default Stiri
