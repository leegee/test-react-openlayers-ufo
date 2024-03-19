/**
 * This chap handles the positioning of the results table, which is always set to fill avialable space
 */

import React from 'react';
import { useSelector } from 'react-redux';

import { dispatchHideReportEvent } from './custom-events/report-width';

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
        dispatchHideReportEvent();
    }

    return '';
};

export default Panel;
