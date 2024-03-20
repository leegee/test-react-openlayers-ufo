import { MapBaseLayerKeyType } from '../Map';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectBasemapSource, setBasemapSource } from '../redux/mapSlice';

const ThemeToggleButton: React.FC = () => {
    const dispatch = useDispatch();
    const basemapSource: MapBaseLayerKeyType = useSelector(selectBasemapSource);

    const handleClick = () => {
        const newBasemapSource = getNextBasemapSource(basemapSource);
        dispatch(setBasemapSource(newBasemapSource));
        console.debug(`Map theme was ${basemapSource} now ${newBasemapSource}`);
    }

    return (
        <button onClick={handleClick} className='theme-ctrl highlightable ol-unselectable ol-control' />
    );
};

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
