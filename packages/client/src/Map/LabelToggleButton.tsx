import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setShowLabels } from '../redux/guiSlice';

import './LabelToggleButton.css';

const LabelToggleButton: React.FC = () => {
    const dispatch = useDispatch();
    const { showLabels } = useSelector((state: RootState) => state.gui);


    const handleClick = () => {
        dispatch(setShowLabels(!showLabels));
    }

    return (
        <button onClick={handleClick} id='labels-ctrl' className='map-ctrl highlightable ol-unselectable ol-control' />
    );
};

export default LabelToggleButton;
