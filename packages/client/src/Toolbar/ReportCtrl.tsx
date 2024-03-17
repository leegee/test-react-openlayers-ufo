import React, { useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { REPORT_NARROW_WIDTH, REPORT_FULL_WIDTH } from '../custom-events/report-width';
import { type RootState } from '../redux/types';

import './ReportCtrl.css';

const Panel: React.FC = () => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [fullWidth, setFullWidth] = useState<boolean>(false);
    const resultsCount = useSelector((state: RootState) => state.map.resultsCount);
    const clusterCount = useSelector((state: RootState) => state.map.featureCollection ? state.map.featureCollection.clusterCount : 0);

    const toggleCollapse = () => {
        setCollapsed(prev => !prev);
        if (!collapsed) {
            setFullWidth(false);
        }
    };

    const toggleFullWidth = () => {
        setFullWidth(prev => !prev);
        if (!fullWidth) {
            setCollapsed(false);
        }
        window.dispatchEvent(new CustomEvent(fullWidth ? REPORT_FULL_WIDTH : REPORT_NARROW_WIDTH));
    };

    return (
        <header className='report-ctrl component'>
            {!clusterCount && resultsCount && resultsCount > 0 ? (
                <>
                    <button className="collapse-btn" onClick={toggleCollapse} />
                    <span>
                        {new Intl.NumberFormat(config.locale).format(resultsCount || 0)}
                        {' '}
                        {get('panel.results_count')}
                    </span>
                    <button className="full-width-btn" onClick={toggleFullWidth} />
                </>
            ) : (
                <>
                    {new Intl.NumberFormat(config.locale).format(clusterCount)}
                    {' '}
                    {get('panel.cluster_count')}
                </>
            )}
        </header>
    );
};

export default Panel;
