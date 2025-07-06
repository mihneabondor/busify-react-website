import { useEffect } from "react"

function AppStoreRedirects() {
    useEffect(() => {
        if(navigator.userAgent.toLowerCase().indexOf("android") !== -1) {
            window.location.href = "https://play.google.com/store/apps/details?id=com.mihnea.busifyandroid"
        } else if(navigator.userAgent.toLowerCase().indexOf("iphone") !== -1) {
            window.location.href = "https://apps.apple.com/us/app/busify-cluj/id6736881022"
        } else {
            window.location.href = "https://app.busify.ro"
        }
    }, [])

    return (
        <></>
    )
}

export default AppStoreRedirects