import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { EVENT_SHOW_POINT } from './custom-events/point-show';
import { type RootState } from './redux/types';

import './ResultsPanel.css';

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [, setFullWidth] = useState<boolean>(false);
    const resultsCount = useSelector((state: RootState) => state.map.resultsCount);
    const clusterCount = useSelector((state: RootState) => state.map.featureCollection ? state.map.featureCollection.clusterCount : 0);

    useEffect(() => {
        document.addEventListener(
            EVENT_SHOW_POINT,
            (() => {
                setFullWidth(true);
                setCollapsed(false);
            }) as EventListener
        );
    }, []);

    useEffect(() => {
        if (clusterCount === 0 && !collapsed) {
            setCollapsed(true);
        }
    }, [clusterCount, collapsed]);

    if (resultsCount && !clusterCount) {
        return (
            <main className='panel'>
                {children}
            </main>
        );
    }

    return '';
};

export default Panel;
