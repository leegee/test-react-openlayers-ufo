import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { EVENT_SHOW_POINT } from './custom-events/point-show';
import { type RootState } from './redux/types';

import './ResultsPanel.css';

interface PanelProps {
    children: React.ReactNode;
}

export const REPORT_FULL_WIDTH = 'REPORT_FULL_WIDTHH';
export const REPORT_NARROW_WIDTH = 'REPORT_NARROW_WIDTH';

const Panel: React.FC<PanelProps> = ({ children }) => {
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
            window.dispatchEvent(new CustomEvent(REPORT_NARROW_WIDTH));
        } else {
            window.dispatchEvent(new CustomEvent(REPORT_FULL_WIDTH));
        }
    };

    useEffect(() => {
        window.document.addEventListener(
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

    return (
        <div className={`panel ${collapsed ? 'collapsed' : ''} ${fullWidth ? 'full-width' : 'narrow-width'}`}>

            {!clusterCount && resultsCount && resultsCount > 0 ? (
                <header className='points'>
                    <button className="collapse-btn" onClick={toggleCollapse} />
                    <span>
                        {new Intl.NumberFormat(config.locale).format(resultsCount || 0)}
                        {' '}
                        {get('panel.results_count')}
                    </span>
                    <button className="full-width-btn" onClick={toggleFullWidth} />
                </header>
            ) : (
                <header className='clusters'>
                    {new Intl.NumberFormat(config.locale).format(clusterCount)}
                    {' '}
                    {get('panel.cluster_count')}
                </header>
            )}


            <main>
                {clusterCount !== 0 ? (
                    <>{children}</>
                ) : (
                    <div>{get('panel.only_clusters_not_points')}</div>
                )}
            </main>

        </div>
    );
};

export default Panel;
