import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { type RootState } from './redux/types';

import './ResultsPanel.css';

export const EVENT_FULL_WIDTH = 'ufo-report-full-width';

const numberFormatter = new Intl.NumberFormat(config.locale);

interface PanelProps {
    children: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [fullWidth, setFullWidth] = useState<boolean>(false);
    const resultsCount = useSelector((state: RootState) => state.map.resultsCount);

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
    };

    useEffect(() => {
        window.document.addEventListener(
            EVENT_FULL_WIDTH,
            (() => {
                setFullWidth(true);
                setCollapsed(false);
            }) as EventListener
        );
    }, []);

    return (
        <div className={`panel ${collapsed ? 'collapsed' : ''} ${fullWidth ? 'full-width' : 'less-width'}`}>
            <header>
                <button className="collapse-btn" onClick={toggleCollapse} />
                <span>
                    {resultsCount ?
                        numberFormatter.format(resultsCount) + ' ' + get('panel.results_count')
                        : get('panel.headerTitle')}
                </span>
                <button className="full-width-btn" onClick={toggleFullWidth} />
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};

export default Panel;
