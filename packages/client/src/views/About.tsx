// About.tsx
import React from 'react';
import Modal from '../components/Modal';
import { get } from 'react-intl-universal';

import './About.css';

const About: React.FC = () => {
    return <Modal title={get('about.title')}>
        <section id='about'>
            <p>
                A map experiment in representing reports of UFO sightings.
            </p>

            <h3>Data Sources</h3>
            <h4>Reports</h4>
            <p>
                Previously published detailed data was obtained from UFO Norway via Project Hassdalen.
                Loose data with truncated report text was found in the wild, claiming to originate from MUFON.
            </p>

            <h4>Background Map Tiles</h4>
            <p>
                &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors; &copy; <a href="https://carto.com/attributions">CARTO</a>; &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community;
            </p>

            <h3>Resources</h3>
            <p>
                React, Redux-Toolkit, Koa, pg, PostGIS.
            </p>

            <h3>Author</h3>
            <p>
                All bugs and errors attributable to <a href="mailto:leegee@gmail.com">Lee Goddard</a>
            </p>
        </section>
    </Modal >
};

export default About;
