import {useEffect, useState} from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination } from 'swiper/modules';
import { Button } from "react-bootstrap";
import './Onboarding.css';
import { ReactComponent as First } from '../Images/Onboarding/First.svg';
import {useNavigate} from "react-router-dom";
import {useSheet} from "../Contexts/SheetContext";

function Onboarding() {
    const [swiperInstance, setSwiperInstance] = useState(null);
    const nav = useNavigate();

    const {setSheetOpen} = useSheet();

    useEffect(() => {
        setSheetOpen(true);
    })

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: '99vw',
                height: '100vh',
                alignItems: 'center',
                padding: '20px'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px 5px'
            }}>
                <img
                    src={require('../Images/Logo/logo512.png')}
                    style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '5px',
                        marginBottom: '5px',
                        marginRight: '5px'
                    }}
                    alt=""
                />
                <h1><b>Busify</b></h1>
            </div>

            {/* Swiper */}
            <div style={{ flex: 1, width: '100%' }}>
                <Swiper
                    onSwiper={setSwiperInstance}
                    style={{ height: '95%' }}
                    pagination={{
                        // dynamicBullets: true,
                        clickable: true,
                    }}
                    modules={[Pagination]}
                    className="mySwiper purple-swiper"
                >
                    <SwiperSlide>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-evenly',
                                textAlign: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <div style={{
                                width: '80%',
                                maxWidth: '300px',
                                height: 'auto',
                            }}>
                                <First style={{width: '100%', height: 'auto', marginBottom: "30px"}}/>
                            </div>

                            <div style={{padding: '0 20px 10px 20px'}}>
                                <h1>
                                    <b>Călătoritul cu transportul în comun făcut ușor!</b>
                                </h1>
                                Localizează în timp real mijloacele
                                de transport în comun din Cluj!
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-evenly', // important
                                textAlign: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <div style={{padding: '0 20px 10px 20px'}}>
                                <h1>
                                    <b>Vezi informații în timp real despre autobuzul tău.</b>
                                </h1>
                                Tot ce ai nevoie în mers: locație live, bilete, stații, toate la îndemână!
                            </div>

                            <div
                                style={{
                                    width: '80%',
                                    maxWidth: '300px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <img src={require('../Images/Onboarding/Second.png')} alt={''}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        transform: 'scale(1.2)', // scale it
                                        transformOrigin: 'center center', // ensure scaling is centered
                                    }}
                                />
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-evenly', // important
                                textAlign: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <div style={{padding: '0 15px 10px 15px'}}>
                                <h1>
                                    <b>Află cu ușurință direcția
                                        și stațiile următoare.</b>
                                </h1>
                                Date precise despre rute și opriri, pentru
                                un transport urban eficient.
                            </div>

                            <div
                                style={{
                                    width: '80%',
                                    maxWidth: '300px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <img src={require('../Images/Onboarding/Third.png')} alt={''}
                                     style={{
                                         width: '100%',
                                         height: 'auto',
                                         transform: 'scale(1.2)', // scale it
                                         transformOrigin: 'center center', // ensure scaling is centered
                                     }}
                                />
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-evenly', // important
                                textAlign: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <div style={{padding: '0 20px 10px 20px'}}>
                                <h1>
                                    <b>Toate orarele la
                                        o apăsare distanță.</b>
                                </h1>
                                Mai departe, vei alege rutele pe care le frecventezi. Acestea vor apărea pe hartă.
                            </div>

                            <div
                                style={{
                                    width: '80%',
                                    maxWidth: '300px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                            >
                                <img src={require('../Images/Onboarding/Fourth.png')} alt={''}
                                     style={{
                                         width: '100%',
                                         height: 'auto',
                                         transform: 'scale(1.2)', // scale it
                                         transformOrigin: 'center center', // ensure scaling is centered
                                     }}
                                />
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>

            {/* Navigation Buttons */}
            <div style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-between'
            }}>
                <Button style={{
                    background: 'none',
                    color: 'gray',
                    outline: 'none',
                    boxShadow: 'none',
                    border: 'none',
                }} onClick={() => {
                    setSheetOpen(false);
                    nav('/setari/panou-linii')
                }}>
                    Sari peste
                </Button>

                <Button
                    style={{
                        background: '#8A56A3',
                        borderRadius: '20px',
                        padding: '5px 30px',
                        outline: 'none',
                        boxShadow: 'none',
                        border: 'none',
                    }}
                    onClick={() => {
                        if(swiperInstance?.isEnd) {
                            setSheetOpen(false)
                            nav('/setari/panou-linii')
                        }
                        else
                            swiperInstance?.slideNext()
                    }}
                >
                    Înainte
                </Button>
            </div>
        </div>
    );
}

export default Onboarding;