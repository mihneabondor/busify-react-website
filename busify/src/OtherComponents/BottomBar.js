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

import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";


function BottomBar() {
    const nav = useNavigate();
    const location = useLocation();
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
            setTimeout(() => setKeyboardVisible(false), 100); // Delay to prevent flickering
        };

        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const bottomNavItems = useMemo(() => [
        { title: 'Acasă', icon: <HomeIcon />, activeIcon: <HomeIconFill />, page: '/' },
        { title: 'Orare', icon: <OrareIcon />, activeIcon: <OrareIconFill />, page: '/orare' },
        { title: 'Favorite', icon: <FavoriteIcon />, activeIcon: <FavoriteIconFill />, page: '/favorite' },
        { title: 'Știri', icon: <StiriIcon />, activeIcon: <StiriIconFill />, page: '/stiri' },
        { title: 'Setări', icon: <SetariIcon />, activeIcon: <SetariIconFill />, page: '/setari' }
    ], []);

    // Compute selected index based on location
    const selectedIndex = useMemo(() => {
        const path = location.pathname;

        return bottomNavItems.findIndex(item => {
            if (item.page === '/') {
                return ['/','/map','/harta'].some(p => path === p || path.startsWith(p + '/'));
            }
            return path === item.page || path.startsWith(item.page + '/');
        });
    }, [location.pathname, bottomNavItems]);

    useEffect(() => {
        console.log("Location changed:", location.pathname, "selected index:", selectedIndex);
    }, [location, selectedIndex]);

    if (keyboardVisible) return null;

    return (
        <div className="bottom-bar-fixed">
            <BottomNavigation
                key={location.pathname}
                items={bottomNavItems}
                selected={selectedIndex >= 0 ? selectedIndex : 0}
                onItemClick={(item, index) => {
                    if (location.pathname !== item.page) {
                        nav(item.page);
                    }
                }}
                disableSelection
                activeBgColor="white"
                activeTextColor="#915FA8"
            />
        </div>
    );
}

export default BottomBar;
