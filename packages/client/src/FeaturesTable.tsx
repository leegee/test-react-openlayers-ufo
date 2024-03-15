// FeatureTable.tsx
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import './FeatureTable.css';

const FeatureTable: React.FC = () => {
    const featureCollection = useSelector((state: any) => state.map.featureCollection);
    const [features, setFeatures] = useState<any[]>([]); // Change 'any' to your actual feature type

    useEffect(() => {
        if (featureCollection) {
            setFeatures(featureCollection.features);
        }
    }, [featureCollection]);

    if (!features || !features.length) {
        return (<p className='no_data'>{get('report.no_data')}</p>);
    }

    return (
        <table className='report'>
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
                        <td>{feature.properties.location_text}</td>
                        <td>{feature.properties.report_text}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;
