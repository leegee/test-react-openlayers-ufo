import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useParams } from 'react-router-dom';

const SightingDetails: React.FC = () => {
    let { id } = useParams();

    return (
        <section>
            <h2>{get('sighting_details.title')} {id}</h2>
            <table>

            </table>
        </section>
    );
};

export default SightingDetails;
