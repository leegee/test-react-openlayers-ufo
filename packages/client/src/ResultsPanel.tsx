import React from 'react';
import { useSelector } from 'react-redux';

import { hideReport } from './custom-events/report-width';

import './ResultsPanel.css';
import { selectClusterCount, selectPointsCount } from './redux/mapSlice';

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const pointsCount = useSelector(selectPointsCount);
    const clusterCount = useSelector(selectClusterCount);

    if (pointsCount && !clusterCount) {
        return (
            <section className='panel'>
                {children}
            </section>
        );
    } else {
        hideReport();
    }

    return '';
};

export default Panel;
