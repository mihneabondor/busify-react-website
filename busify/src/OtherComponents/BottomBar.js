import './BottomBar.css'
import { BottomNavigation } from "reactjs-bottom-navigation"

import {ReactComponent as HomeIcon} from "../Images/homeIcon.svg"
import {ReactComponent as HomeIconFill} from "../Images/homeIconFill.svg"

import {ReactComponent as OrareIconFill} from "../Images/orareIconFill.svg"
import {ReactComponent as OrareIcon} from "../Images/orareIcon.svg"

import {ReactComponent as FavoriteIcon} from "../Images/favoriteIcon.svg"
import {ReactComponent as FavoriteIconFill} from "../Images/favoriteIconFill.svg"

import {ReactComponent as StiriIcon} from "../Images/stiriIcon.svg"
import {ReactComponent as StiriIconFill} from "../Images/stiriIconFill.svg"

import {ReactComponent as SetariIcon} from "../Images/setariIcon.svg"
import {ReactComponent as SetariIconFill} from "../Images/setariIconFill.svg"
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";


function BottomBar() {
    const nav = useNavigate();
    const [keyboardVisible, setKeyboardVisible] = useState(false);


    const isMobileDevice = () => {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    };

    useEffect(() => {
        if (!isMobileDevice()) return;

        const handleFocusIn = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                setKeyboardVisible(true);
            }
        };

        const handleFocusOut = () => {
            setTimeout(() => {
                setKeyboardVisible(false);
            }, 100); // Delay to prevent flickering
        };

        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    if (keyboardVisible) return null;

    const bottomNavItems = [
        {
            title: 'Acasă',
            icon: <HomeIcon />,
            activeIcon: <HomeIconFill />,
            page: '/harta',
        },
        {
            title: 'Orare',
            icon: <OrareIcon />,
            activeIcon: <OrareIconFill />,
            page: '/orare',
        },
        {
            title: 'Favorite',
            icon: <FavoriteIcon />,
            activeIcon: <FavoriteIconFill />,
            page: '/favorite',
        },
        {
            title: 'Știri',
            icon: <StiriIcon />,
            activeIcon: <StiriIconFill />,
            page: '/stiri',
        },
        {
            title: 'Setări',
            icon: <SetariIcon />,
            activeIcon: <SetariIconFill />,
            page: '/setari',
        }
    ];

    const getSelected = () => {
        for (let i = 0; i < bottomNavItems.length; i++) {
            if (window.location.pathname.includes(bottomNavItems[i].page)) {
                return i;
            }
        }
        return 0;
    };

    return (
        <div className="bottom-bar-fixed">
            <BottomNavigation
                items={bottomNavItems}
                selected={getSelected()}
                onItemClick={(item) => nav(item.page)}
                activeBgColor="white"
                activeTextColor="#915FA8"
            />
        </div>
    );
}

export default BottomBar;