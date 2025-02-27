import { MapBaseLayerKeyType } from '../Map';
import React from 'react';
import { get } from 'react-intl-universal';
import { useSelector, useDispatch } from 'react-redux';

import { selectBasemapSource, setBasemapSource } from '../../redux/mapSlice';

import './ThemeToggleButton.css';

const ThemeToggleButton: React.FC = () => {
    const dispatch = useDispatch();
    const basemapSource: MapBaseLayerKeyType = useSelector(selectBasemapSource);

    const handleClick = () => {
        const newBasemapSource = getNextBasemapSource(basemapSource);
        dispatch(setBasemapSource(newBasemapSource));
    }

    return (
        <button title={get('map.buttons.theme')} onClick={handleClick} id='theme-ctrl' className='map-ctrl highlightable ol-unselectable ol-control' />
    );
};

// Use a linked list!
const getNextBasemapSource = (currentBasemapSource: string) => {
    switch (currentBasemapSource) {
        case 'dark':
            return 'light';
        case 'light':
            return 'geo';
        case 'geo':
        default:
            return 'dark';
    }
};

export default ThemeToggleButton;
