import './BottomBar.css'
import { BottomNavigation } from "reactjs-bottom-navigation"

import {ReactComponent as HomeIcon} from "../Images/homeIcon.svg"
import {ReactComponent as HomeIconFill} from "../Images/homeIconFill.svg"

import {ReactComponent as OrareIconFill} from "../Images/orareIconFill.svg"
import {ReactComponent as OrareIcon} from "../Images/orareIcon.svg"

import {ReactComponent as FavoriteIcon} from "../Images/favoriteIcon.svg"
import {ReactComponent as FavoriteIconFill} from "../Images/favoriteIconFill.svg"

import {ReactComponent as StiriIcon} from "../Images/stiriIcon.svg"

import {ReactComponent as SetariIcon} from "../Images/setariIcon.svg"
import {useNavigate} from "react-router-dom";



function BottomBar() {
    let nav = useNavigate()
    const bottomNavItems = [
        {
            title: 'Acasă',
            icon: <HomeIcon/>,
            activeIcon: <HomeIconFill/>,
            page: '/harta'
        },
        {
            title: 'Orare',
            icon: <OrareIcon/>,
            activeIcon: <OrareIconFill/>,
            page: '/orare'
        },
        {
            title: 'Favorite',
            icon: <FavoriteIcon/>,
            activeIcon: <FavoriteIconFill/>,
            page: '/favorite'
        },
        {
            title: 'Știri',
            icon: <StiriIcon/>,
            page: '/stiri'
        },
        {
            title: 'Setări',
            icon: <SetariIcon/>,
            page: '/setari'
        }
    ]

    const getSelected = () => {
        for(let i = 0; i < bottomNavItems.length; i++) {
            if (window.location.pathname.includes(bottomNavItems[i].page)) {
                return i
            }
        }
        return 0
    }

    return (
        <div>
            <BottomNavigation
                items={bottomNavItems}
                selected={getSelected()}
                onItemClick={(item) => {nav(item.page)}}
                activeBgColor="white"
                activeTextColor="#915FA8"
                style={{zIndex: '100',position: "fixed", bottom: 0, width: "100%", borderRadius: "10px 10px 0 0", boxShadow: 'rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px'}}
            />
        </div>
    )
}

export default BottomBar;