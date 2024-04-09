/** ReportToggleButton.tsx */
import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './redux/store';
import { setPanel } from './redux/guiSlice';

import './ReportToggleButton.css';

const ReportButton: React.FC = () => {
    const dispatch = useDispatch();
    const { panel } = useSelector((state: RootState) => state.gui);
    const { isLoading } = useSelector((state: RootState) => state.map);

    useEffect(() => {
        console.log("Panel state:", panel);
    }, [panel]);

    const togglePanel = () => {
        if (panel === 'full') {
            dispatch(setPanel('narrow'));
        } else {
            dispatch(setPanel('full'));
        }
    };

    return (
        <button id='report-button' disabled={isLoading} className='component highlightable' onClick={togglePanel}>
            {panel === 'full' ? (
                <span className='close-full-width' title={get('close')} aria-label={get('close')} />
            ) : (
                <span className='open-full-width' title={get('open')} aria-label={get('open')} />
            )}
        </button>
    );
};

export default ReportButton;
