import React from "react";
import BottomBar from "./BottomBar/BottomBar";
import Map from "./Map/Map";

const App = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Main content area */}
            <main className="flex-grow flex overflow-hidden">
                {/* Map container with constrained height */}
                <div className="overflow-hidden" style={{height: "92vh"}}>
                    <Map/>
                </div>
            </main>

            {/* Bottom bar */}
            <BottomBar />
        </div>
    );
};

export default App;