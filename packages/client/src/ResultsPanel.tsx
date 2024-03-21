/**
 * This chap handles the positioning of the results table, which is always set to fill avialable space
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectPointsCount } from './redux/mapSlice';
import { setPanel } from './redux/guiSlice';

import './ResultsPanel.css';

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const pointsCount = useSelector(selectPointsCount);
    const dispatch = useDispatch();

    const onEscCloseFullReport = (e: KeyboardEvent) => { if (e.key === 'Escape') { dispatch(setPanel('')) } };

    useEffect(() => {
        if (!pointsCount) {
            dispatch(setPanel(''));
        }
    }, [pointsCount, dispatch]);

    useEffect(() => {
        document.addEventListener('keyup', onEscCloseFullReport);
        return () => document.removeEventListener('keyup', onEscCloseFullReport)
    }, [])

    return !pointsCount ? '' : (
        <section className='panel'>
            {children}
        </section>
    );
};

export default Panel;
