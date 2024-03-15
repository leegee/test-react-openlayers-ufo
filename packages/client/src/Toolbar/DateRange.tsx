import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Slider from 'rc-slider';

import { MapDictionary } from '@ufo-monorepo-test/common-types/src';
import { RootState } from '../redux/types';

import 'rc-slider/assets/index.css';
import './DateRange.css';

const DateRange: React.FC = () => {
    const dictionary: MapDictionary | undefined = useSelector((state: RootState) => state.map.dictionary);

    const [minValueSelected, setMinValueSelected] = useState<number>(1);
    const [maxValueSelected, setMaxValueSelected] = useState<number>(2);

    useEffect(() => {
        if (dictionary && dictionary.datetime) {
            setMinValueSelected(dictionary.datetime.min || 0);
            setMaxValueSelected(dictionary.datetime.max || 2);
        }
    }, [dictionary]);

    const handleSliderChange = (values: number | number[]) => {
        if (values instanceof Array) {
            setMinValueSelected(values[0]);
            setMaxValueSelected(values[1]);
        }
    };

    return (
        <aside className='date-range'>
            <span className='date from'>{minValueSelected === 1 ? 'N/A' : minValueSelected}</span>
            <Slider
                range={true}
                min={minValueSelected}
                max={maxValueSelected}
                value={[minValueSelected, maxValueSelected]}
                onChange={handleSliderChange}
            />
            <span className='date to'>{maxValueSelected}</span>
        </aside>
    );
}

export default DateRange;
