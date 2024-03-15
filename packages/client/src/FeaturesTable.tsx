// FeatureTable.tsx
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';
import { RootState } from './redux/types';

import './FeatureTable.css';

const FeatureTable: React.FC = () => {
    const featureCollection = useSelector((state: any) => state.map.featureCollection);
    const [features, setFeatures] = useState<any[]>([]);
    const { q } = useSelector((state: RootState) => state.map);

    useEffect(() => {
        if (featureCollection) {
            setFeatures(featureCollection.features);
        }
    }, [featureCollection]);

    if (!features || !features.length) {
        return (<p className='no_data'>{get('report.no_data')}</p>);
    }

    const highlightText = (text: string) => {
        if (!text) return;
        if (typeof q === 'undefined' || q.trim() === '') {
            return text;
        }
        const parts = text.split(new RegExp(`(${q})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === q.toLowerCase() ? (
                <mark key={index}>{part}</mark>
            ) : (
                <React.Fragment key={index}>{part}</React.Fragment>
            )
        );
    };

    return (
        <table className='feature-table'>
            <thead>
                <tr>
                    <th>{get('report.date')}</th>
                    <th>{get('report.location')}</th>
                    <th>{get('report.report')}</th>
                </tr>
            </thead>
            <tbody>
                {features.map((feature: any, index: number) => (
                    <tr key={index}>
                        <td>{feature.properties.datetime_original}</td>
                        <td>{highlightText(feature.properties.location_text)}</td>
                        <td>{highlightText(feature.properties.report_text)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;
