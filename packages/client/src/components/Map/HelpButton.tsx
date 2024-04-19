import React from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from 'react-intl-universal';

import './HelpButton.css';

const HelpButton: React.FC = () => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate('/about');
    }

    return (
        <button onClick={handleClick} id='help-butto-ctrl' className='map-ctrl highlightable ol-unselectable' title={get('info')} aria-label={get('info')} />
    );
};

export default HelpButton;
