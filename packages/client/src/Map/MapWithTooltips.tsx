import React, { createContext, ReactNode } from 'react';
import Map from 'ol/Map';

interface MapWithTooltipsProps {
    children: ReactNode; // Accept any valid ReactNode as children
}

interface MapContextType {
    map: Map | null;
}

export const MapContext = createContext<MapContextType>({ map: null });

const MapWithTooltips: React.FC<MapWithTooltipsProps> = ({ children }) => {
    return (
        <MapContext.Provider value={{ map: null }}>
            <div id="map" style={{ width: '100%', height: '100%' }}>
                {children}
            </div>
        </MapContext.Provider>
    );
};

export default MapWithTooltips;
