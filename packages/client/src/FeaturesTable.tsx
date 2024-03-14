// FeatureTable.tsx
import React, { useEffect, useState } from 'react';
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

    return (
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Report</th>
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
