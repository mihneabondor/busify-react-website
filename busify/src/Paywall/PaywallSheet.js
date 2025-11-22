import {BottomSheet} from "react-spring-bottom-sheet";
import Paywall from "./Paywall";
import CloseButton from "react-bootstrap/CloseButton";

export default function PaywallSheet(props) {
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