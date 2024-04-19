import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { setPanel } from '../redux/guiSlice';

import { RootState } from '../redux/store';

const OpenReport: React.FC = () => {
    const { panel } = useSelector((state: RootState) => state.gui);
    const [previousPanelState, setPreviousPanelState] = useState(panel);

    useEffect(() => {
        setPreviousPanelState(panel);
        setPanel('full');
        () => setPanel(previousPanelState);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panel]);

    return '';
}

export default OpenReport;
