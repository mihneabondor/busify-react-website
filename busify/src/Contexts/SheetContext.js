import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const SheetContext = createContext();

export const SheetProvider = ({ children }) => {
    const [sheetOpen, setSheetOpenState] = useState(false);
    const listenersRef = useRef(new Set());

    const setSheetOpen = useCallback((value) => {
        setSheetOpenState(value);
        listenersRef.current.forEach(listener => listener(value));
    }, []);

    const subscribe = useCallback((listener) => {
        listenersRef.current.add(listener);
        return () => listenersRef.current.delete(listener);
    }, []);

    useEffect(() => {
        console.log('SheetContext: sheetOpen =', sheetOpen);
    }, [sheetOpen]);

    return (
        <SheetContext.Provider value={{ sheetOpen, setSheetOpen, subscribe }}>
            {children}
        </SheetContext.Provider>
    );
};

export const useSheet = () => {
    const context = useContext(SheetContext);
    if (!context) {
        throw new Error('useSheet must be used within SheetProvider');
    }
    return context;
};