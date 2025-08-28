import Switch from "react-ios-switch";

function CustomSwitch(props) {
    return (
        <Switch
            checked={props.checked}
            onChange={props.onChange}
            disabled={props.disabled}
            onColor="#8A56A3"
            style={{marginLeft: props.marginLeftAuto === "false" ? '0' : 'auto', scale: '0.8'}}
        />
    )
}

export default CustomSwitch;