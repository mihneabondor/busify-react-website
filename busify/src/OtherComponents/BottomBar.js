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
import {AliveScope} from "react-activation";
import {useSheet} from "../Contexts/SheetContext";

const STORAGE_KEY = 'lastMapPath';
const MAP_PATHS = ['/', '/map', '/harta'];

function BottomBar() {
    const nav = useNavigate();
    const location = useLocation();
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const { sheetOpen, subscribe } = useSheet();
    const [localSheetOpen, setLocalSheetOpen] = useState(sheetOpen);

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
            setTimeout(() => setKeyboardVisible(false), 100);
        };

        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    useEffect(() => {
        setLocalSheetOpen(sheetOpen);

        const unsubscribe = subscribe?.((value) => {
            console.log('BottomBar received sheet update:', value);
            setLocalSheetOpen(value);
        });

        return () => unsubscribe?.();
    }, [sheetOpen, subscribe]);

    // Track the last map path in sessionStorage
    useEffect(() => {
        const p = location.pathname;

        // Check if current path is exactly one of the map paths
        if (MAP_PATHS.includes(p)) {
            sessionStorage.setItem(STORAGE_KEY, p);
            console.log("✓ Stored map path:", p);
        }
    }, [location.pathname]);

    const bottomNavItems = useMemo(() => [
        { title: 'Acasă', icon: <HomeIcon />, activeIcon: <HomeIconFill />, page: '/' },
        { title: 'Orare', icon: <OrareIcon />, activeIcon: <OrareIconFill />, page: '/orare' },
        { title: 'Favorite', icon: <FavoriteIcon />, activeIcon: <FavoriteIconFill />, page: '/favorite' },
        { title: 'Știri', icon: <StiriIcon />, activeIcon: <StiriIconFill />, page: '/stiri' },
        { title: 'Setări', icon: <SetariIcon />, activeIcon: <SetariIconFill />, page: '/setari' }
    ], []);

    // Compute selected index based on location
    const selectedIndex = useMemo(() => {
        const p = location.pathname;

        return bottomNavItems.findIndex(item => {
            if (item.page === '/') {
                return MAP_PATHS.some(m => p === m || p.startsWith(m + '/'));
            }

            return p === item.page || p.startsWith(item.page + '/');
        });
    }, [location.pathname, bottomNavItems]);

    if (keyboardVisible || sheetOpen) return null;

    return (
        <BottomNavigation
            items={bottomNavItems}
            selected={selectedIndex >= 0 ? selectedIndex : 0}
            onItemClick={(item, index) => {
                sessionStorage.setItem("navigation_last_page", location.pathname);
                nav(item.page, { replace: false });
            }}
            disableSelection
            activeBgColor="white"
            activeTextColor="#915FA8"
        />
    );
}

export default BottomBar;