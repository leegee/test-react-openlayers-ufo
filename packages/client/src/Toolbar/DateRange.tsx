import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFromDate, setToDate } from '../redux/mapSlice';

import { MapDictionary } from '@ufo-monorepo-test/common-types/src';
import { RootState } from '../redux/types';

import './DateRange.css';
import { get } from 'react-intl-universal';

const DateRange: React.FC = () => {
    const dispatch = useDispatch();
    const dictionary: MapDictionary | undefined = useSelector((state: RootState) => state.map.dictionary);

    const [minYear, setMinYear] = useState<number | undefined>(undefined);
    const [maxYear, setMaxYear] = useState<number | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);


    useEffect(() => {
        if (dictionary && dictionary.datetime && dictionary.datetime.min && dictionary.datetime.max) {
            setMinYear(dictionary.datetime.min);
            setMaxYear(dictionary.datetime.max);
        }
    }, [dictionary]);

    const handleMinYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && (maxYear === undefined || value <= maxYear)) {
            setMinYear(value);
            setError(undefined);
            dispatch(setFromDate(value));
        } else {
            setError(get('date_range.error.min_range'));
        }
    };

    const handleMaxYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && (minYear === undefined || value >= minYear)) {
            setMaxYear(value);
            setError(undefined);
            dispatch(setToDate(value));
        } else {
            setError(get('date_range.error.max_range'));
        }
    };

    return (
        <aside className='date-range'>
            <span className='grey calendar'>📅</span>
            <input
                type='number'
                id='minYear'
                name='minYear'
                value={minYear === undefined ? '' : String(minYear).padStart(4, '0')}
                onChange={handleMinYearChange}
            />
            -
            <input
                type='number'
                id='maxYear'
                name='maxYear'
                value={maxYear === undefined ? '' : maxYear}
                onChange={handleMaxYearChange}
            />
            {/* {error && <span className='error'>{error}</span>} */}
        </aside>
    );
}

export default DateRange;
