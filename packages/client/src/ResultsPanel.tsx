/**
 * This chap handles the positioning of the results table, which is always set to fill avialable space
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectClusterCount, selectPointsCount } from './redux/mapSlice';
import { setPanel } from './redux/guiSlice';

// import { dispatchHideReportEvent } from './custom-events/report-width';

import './ResultsPanel.css';

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const pointsCount = useSelector(selectPointsCount);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!pointsCount) {
            dispatch(setPanel(''));
        }
    }, [pointsCount, dispatch]);

    return !pointsCount ? '' : (
        <section className='panel'>
            {children}
        </section>
    );
};

export default Panel;
