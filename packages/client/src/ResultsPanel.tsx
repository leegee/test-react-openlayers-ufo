import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { type RootState } from './redux/store';

import './ResultsPanel.css';

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const resultsCount = useSelector((state: RootState) => state.map.resultsCount);
    const clusterCount = useSelector((state: RootState) => state.map.featureCollection ? state.map.featureCollection.clusterCount : 0);

    if (resultsCount && !clusterCount) {
        return (
            <section className='panel'>
                {children}
            </section>
        );
    }

    return '';
};

export default Panel;
