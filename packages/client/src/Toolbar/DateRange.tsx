import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'debounce';

import { MapDictionary } from '@ufo-monorepo-test/common-types/src';
import { fetchFeatures, setFromDate, setToDate } from '../redux/mapSlice';
import { RootState } from '../redux/types';

import './DateRange.css';
import { get } from 'react-intl-universal';

const DEBOUNCE_FETCH_MS = 900;

function setError(msg: string) {
    console.warn(msg); // TODO
}

let initialised = false;

const DateRange: React.FC = () => {
    const dispatch = useDispatch();
    const dictionary: MapDictionary | undefined = useSelector((state: RootState) => state.map.dictionary);
    const { from_date, to_date } = useSelector((state: RootState) => state.map); // Access date range from Redux state

    useEffect(() => {
        if (!initialised && dictionary && dictionary.datetime && dictionary.datetime.min && dictionary.datetime.max) {
            initialised = true;
            dispatch(setFromDate(dictionary.datetime.min));
            dispatch(setToDate(dictionary.datetime.max));
        }
    }, [dispatch, dictionary]);

    const debouncedFetchFeatures = debounce(() => dispatch(fetchFeatures() as any), DEBOUNCE_FETCH_MS);

    useEffect(() => {
        debouncedFetchFeatures();
    }, [dispatch, from_date, to_date]);

    const handleMinYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && (to_date === undefined || value <= to_date)) {
            dispatch(setFromDate(value));
        } else {
            setError(get('date_range.error.min_range'));
        }
    };

    const handleMaxYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && (from_date === undefined || value >= from_date)) {
            dispatch(setToDate(value));
        } else {
            setError(get('date_range.error.max_range'));
        }
    };

    return (
        <aside className='date-range'>
            <span className='grey calendar'>📅</span>
            <input
                type='text'
                id='minYear'
                name='minYear'
                value={from_date === undefined ? '' : from_date}
                onChange={handleMinYearChange}
            />
            -
            <input
                type='text'
                id='maxYear'
                name='maxYear'
                value={to_date === undefined ? '' : to_date}
                onChange={handleMaxYearChange}
            />
        </aside>
    );
}

export default DateRange;
