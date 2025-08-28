import React, {useEffect, useState} from 'react';
import Marker from "../OtherComponents/Marker";
import CloseButton from "react-bootstrap/CloseButton";
import {BottomSheet} from "react-spring-bottom-sheet";

function UndemibusuToast(props) {
    const [uniqueMarkers, setUniqueMarkers] = useState([]);

    useEffect(() => {
        if (props.show) {
            setTimeout(() => {
                const visibleMarkers = props.markers.current.filter(elem =>
                    (props.unique.current.find(el => el[0] === elem.vehicle.line)?.[1] === true &&
                        !props.foundLabelsRef.current.length) ||
                    props.foundLabelsRef.current.includes(elem.vehicle.label)
                );

                console.log(props.foundLabelsRef.current);
                console.log(visibleMarkers)

                const seen = new Set();
                const uniqueMarkersTemp = visibleMarkers.filter(item => {
                    if (seen.has(item.vehicle.line)) return false;
                    seen.add(item.vehicle.line);
                    return true;
                });

                setUniqueMarkers(uniqueMarkersTemp);
            }, 500);
        }
    }, [props.markers, props.unique, props.show]);

    return (
        <BottomSheet
            open={props.show}
            expandOnContentDrag={false}
            scrollLocking={false}
            blocking={false}
            defaultSnap={({minHeight}) => minHeight}
        >
            <div style={{margin: '10px 20px'}}>
                {uniqueMarkers?.length > 0 ? uniqueMarkers?.map((el, i) => (
                    <div style={{display: "flex", flexDirection: "row", alignItems: "center", marginBottom: '5px'}}>
                        <Marker
                            type={el.vehicle.vehicleType}
                            name={el.vehicle.line}
                            minContent={true}
                        />
                        <div style={{textAlign: 'left'}}><b>{el.vehicle.route}</b></div>
                        <CloseButton style={{marginLeft: 'auto', display: i === 0 ? "initial" : "none"}}
                                     onClick={() => {
                                         setUniqueMarkers([])
                                         props.onHide()
                                     }}/>
                    </div>
                ))
                    :
                    <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    Nu s-au găsit vehicule pentru căutarea ta.
                        <CloseButton style={{marginLeft: 'auto'}}
                                     onClick={() => {
                                         setUniqueMarkers([])
                                         props.onHide()
                                     }}/>
                </div>}
            </div>
        </BottomSheet>
    )
}

export default UndemibusuToast