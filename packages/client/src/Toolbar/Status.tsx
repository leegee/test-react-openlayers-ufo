import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { type RootState } from '../redux/store';
import { selectClusterCount, selectPointsCount } from '../redux/mapSlice';

import './Status.css';

const Panel: React.FC = () => {
    const { loading } = useSelector((state: RootState) => state.map);
    const { locale } = useSelector((state: RootState) => state.gui);
    const pointsCount = useSelector(selectPointsCount);
    const clusterCount = useSelector(selectClusterCount);
    const nothingToShow = !clusterCount && !pointsCount;
    const showPoints = !clusterCount && pointsCount && pointsCount > 0;

    useEffect(() => void (0), [locale]);

    return (
        <header className='report-ctrl component'>
            <span className='inner'>
                {loading ?
                    get('panel.loading')
                    :
                    nothingToShow ? (
                        <>{get('panel.no_results')}</>
                    ) : showPoints ? (
                        <>
                            {new Intl.NumberFormat(config.locale).format(pointsCount)}
                            {' '}
                            {get('panel.results_count')}
                        </>
                    ) : (
                        <>
                            {new Intl.NumberFormat(config.locale).format(clusterCount)}
                            {' '}
                            {get('panel.cluster_count')}
                        </>
                    )}
            </span>
        </header>
    );
};

export default Panel;
