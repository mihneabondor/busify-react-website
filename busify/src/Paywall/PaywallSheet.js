import {BottomSheet} from "react-spring-bottom-sheet";
import Paywall from "./Paywall";
import CloseButton from "react-bootstrap/CloseButton";
import {useEffect} from "react";
import {useSheet} from "../Contexts/SheetContext";

export default function PaywallSheet(props) {

    const {sheetOpen, setSheetOpen} = useSheet();

    useEffect(() => {
        console.log(props.show)
        setSheetOpen(!!props.show);
    }, [props.show])

    return (
        <BottomSheet
            style={{zIndex: 9999}}
            open={props.show}
            scrollLocking={false}
        >
            <Paywall onHide={props.onHide} />
        </BottomSheet>
    )
}