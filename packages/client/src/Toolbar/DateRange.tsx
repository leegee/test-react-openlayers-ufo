import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Slider from 'rc-slider';

import { MapDictionary } from '@ufo-monorepo-test/common-types/src';
import { RootState } from '../redux/types';

import 'rc-slider/assets/index.css';
import './DateRange.css';

const DateRange: React.FC = () => {
    const dictionary: MapDictionary | undefined = useSelector((state: RootState) => state.map.dictionary);

    const minValue = dictionary?.datetime?.min || 1;
    const maxValue = dictionary?.datetime?.max || new Date().getFullYear();

    const [minValueSelected, setMinValueSelected] = useState(minValue);
    const [maxValueSelected, setMaxValueSelected] = useState(maxValue);

    const handleSliderChange = (values: number | number[]) => {
        if (values instanceof Array) {
            setMinValueSelected(values[0]);
            setMaxValueSelected(values[1]);
        }
    };

    return (
        <aside className='date-range'>
            <span className='date from'>{minValueSelected}</span>
            <Slider
                range={true}
                min={minValue}
                max={maxValue}
                value={[minValueSelected, maxValueSelected]}
                onChange={handleSliderChange}
            />
            <span className='date to'>{maxValueSelected}</span>
        </aside>
    );
}

export default DateRange;
