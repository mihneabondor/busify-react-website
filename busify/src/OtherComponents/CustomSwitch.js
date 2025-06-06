import Switch from "react-ios-switch";

function CustomSwitch(props) {
    return (
        <Switch
            checked={props.checked}
            onChange={props.onChange}
            disabled={props.disabled}
            onColor="#8A56A3"
            style={{marginLeft: 'auto', scale: '0.8'}}
        />
    )
}

export default CustomSwitch;