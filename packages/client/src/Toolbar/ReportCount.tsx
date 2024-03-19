import React from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { type RootState } from '../redux/store';

import './ReportCount.css';
import { mapScoreToHue } from '../lib/sightings-styles';

const Panel: React.FC = () => {
    const { q, resultsCount } = useSelector((state: RootState) => state.map);
    const clusterCount = useSelector((state: RootState) => state.map.featureCollection ? state.map.featureCollection.clusterCount : 0);

    const nothingToShow = !clusterCount && !resultsCount;
    const showPoints = !clusterCount && resultsCount && resultsCount > 0;
    let gradientBorder;

    if (q) {
        gradientBorder = {
            borderImage: `linear-gradient(to right, hsl(${mapScoreToHue(0)}, 100%, 50%), hsl(${mapScoreToHue(1)}, 100%, 50%)) 1`,
            borderStyle: 'solid',
            borderWidth: '1pt',
        };
    }

    return (
        <header className='report-ctrl component' style={gradientBorder}><span className='inner'>
            {nothingToShow ? (
                <>{get('panel.no_results')}</>
            ) : showPoints ? (
                <>
                    {new Intl.NumberFormat(config.locale).format(resultsCount)}
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
        </span></header>
    );
};

export default Panel;
