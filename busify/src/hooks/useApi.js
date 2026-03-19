import useSWR from 'swr';

// Global fetcher function
const fetcher = (url) => fetch(url).then((res) => {
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
});

// SWR configuration defaults
const defaultConfig = {
    revalidateOnFocus: false,      // Don't refetch when window regains focus
    revalidateOnReconnect: true,   // Refetch when network reconnects
    dedupingInterval: 60000,       // Dedupe requests within 1 minute
    errorRetryCount: 3,            // Retry failed requests 3 times
};

// ============================================
// BUSES BASIC - Used by multiple components
// ============================================
export function useBusesBasic() {
    const { data, error, isLoading, mutate } = useSWR(
        'https://orare.busify.ro/public/buses_basic.json',
        fetcher,
        {
            ...defaultConfig,
            revalidateIfStale: false,   // Data rarely changes
            dedupingInterval: 300000,   // 5 minutes - prevent duplicate requests
        }
    );

    // Flatten the data structure (urbane, metropolitane, market, noapte)
    const lines = data ? [
        ...(data.urbane || []),
        ...(data.metropolitane || []),
        ...(data.market || []),
        ...(data.noapte || [])
    ] : [];

    return {
        lines,
        rawData: data,
        isLoading,
        isError: error,
        mutate
    };
}

// ============================================
// SCHEDULE DATA - Individual line schedules
// ============================================
export function useSchedule(linie) {
    const { data, error, isLoading, mutate } = useSWR(
        linie ? `https://orare.busify.ro/public/${linie}.json` : null,
        fetcher,
        {
            ...defaultConfig,
            revalidateIfStale: false,
            dedupingInterval: 300000,   // 5 minutes
        }
    );

    return {
        schedule: data,
        isLoading,
        isError: error,
        mutate
    };
}

// ============================================
// ANNOUNCEMENTS - Schedule modifications
// ============================================
export function useAnunturi() {
    const { data, error, isLoading } = useSWR(
        'https://busifyserver.onrender.com/anunturi',
        fetcher,
        {
            ...defaultConfig,
            refreshInterval: 300000,    // Refresh every 5 minutes
            dedupingInterval: 60000,    // 1 minute deduplication
        }
    );

    return {
        anunturi: data,
        isLoading,
        isError: error
    };
}

// ============================================
// STOPS DATA - All bus stops
// ============================================
export function useStops() {
    const { data, error, isLoading } = useSWR(
        'https://busifyserver.onrender.com/stops',
        fetcher,
        {
            ...defaultConfig,
            revalidateIfStale: false,
            dedupingInterval: 600000,   // 10 minutes - stops rarely change
        }
    );

    return {
        stops: data || [],
        isLoading,
        isError: error
    };
}

// ============================================
// STOP TIMES - Trip stop associations
// ============================================
export function useStopTimes() {
    const { data, error, isLoading } = useSWR(
        'https://busifyserver.onrender.com/stoptimes',
        fetcher,
        {
            ...defaultConfig,
            revalidateIfStale: false,
            dedupingInterval: 600000,   // 10 minutes
        }
    );

    return {
        stopTimes: data || [],
        isLoading,
        isError: error
    };
}

// ============================================
// ROUTES DATA
// ============================================
export function useRoutes() {
    const { data, error, isLoading } = useSWR(
        'https://busifyserver.onrender.com/routes',
        fetcher,
        {
            ...defaultConfig,
            revalidateIfStale: false,
            dedupingInterval: 600000,   // 10 minutes
        }
    );

    return {
        routes: data || [],
        isLoading,
        isError: error
    };
}

// ============================================
// MAPBOX TOKEN
// ============================================
export function useMapboxToken() {
    const { data, error, isLoading } = useSWR(
        'https://busifyserver.onrender.com/mapbox',
        fetcher,
        {
            ...defaultConfig,
            revalidateIfStale: false,
            dedupingInterval: 3600000,  // 1 hour - token doesn't change often
        }
    );

    return {
        mapboxData: data,
        isLoading,
        isError: error
    };
}

// ============================================
// COMBINED HOOK - For Map component initial load
// ============================================
export function useMapInitialData() {
    const { mapboxData, isLoading: mapboxLoading, isError: mapboxError } = useMapboxToken();
    const { stops, isLoading: stopsLoading, isError: stopsError } = useStops();
    const { stopTimes, isLoading: stopTimesLoading, isError: stopTimesError } = useStopTimes();
    const { lines, rawData: busesBasic, isLoading: busesLoading, isError: busesError } = useBusesBasic();

    const isLoading = mapboxLoading || stopsLoading || stopTimesLoading || busesLoading;
    const isError = mapboxError || stopsError || stopTimesError || busesError;

    return {
        mapboxData,
        stops,
        stopTimes,
        lines,
        busesBasic,
        isLoading,
        isError
    };
}
