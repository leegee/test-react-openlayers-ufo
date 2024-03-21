import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { RootState } from './redux/store';
import { fetchSightingDetails } from './redux/sightingDetailsSlice';

const SightingDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useDispatch();
    const { loading, error, details } = useSelector((state: RootState) => state.details);

    useEffect(() => {
        dispatch(fetchSightingDetails(id!));
    }, [dispatch, id]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <section id='sighting-details'>
            <h2>{get('sighting_details.title')} {id}</h2>
            <table>
                {Object.keys(details)
                    .filter((column: string) => column !== 'point' && details[column] !== null)
                    .map((column: string, index: number) => (
                        <tr key={index}>
                            <td>{column}</td>
                            <td>{details[column]?.toString()}</td>
                        </tr>
                    ))}
            </table>
        </section>
    );
};

export default SightingDetails;
