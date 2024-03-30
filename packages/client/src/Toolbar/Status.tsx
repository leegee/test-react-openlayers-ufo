import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import { type RootState } from '../redux/store';
import { selectClusterCount, selectPointsCount } from '../redux/mapSlice';

import './Status.css';

const Panel: React.FC = () => {
    const { locale } = useSelector((state: RootState) => state.gui);
    const pointsCount = useSelector(selectPointsCount);
    const clusterCount = useSelector(selectClusterCount);
    const nothingToShow = !clusterCount && !pointsCount;
    const showPoints = !clusterCount && pointsCount && pointsCount > 0;

    useEffect(() => void (0), [locale]);

    return (
        <header className='report-ctrl component'>
            <span className='inner'>
                {nothingToShow ? (
                    <>{get('panel.no_results')}</>
                ) : showPoints ? (
                    <>
                        {get('panel.points_count', { count: pointsCount })}
                    </>
                ) : (
                    <>
                        {get('panel.cluster_count', { count: clusterCount })}
                    </>
                )}
            </span>
        </header>
    );
};

export default Panel;
