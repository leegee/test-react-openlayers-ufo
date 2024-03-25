import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { MapDictionary } from '@ufo-monorepo-test/common-types/src';
import { fetchFeatures, setFromDate, setToDate, selectPointsCount } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './DateRange.css';
import { get } from 'react-intl-universal';

const DateRange: React.FC = () => {
    const dispatch = useDispatch();
    const dictionary: MapDictionary | undefined = useSelector((state: RootState) => state.map.dictionary);
    const pointsCount = useSelector(selectPointsCount);
    const { from_date, to_date } = useSelector((state: RootState) => state.map);
    const [localFromDate, setLocalFromDate] = useState<any>(from_date!);
    const [localToDate, setLocalToDate] = useState<any>(to_date!);

    useEffect(() => {
        if (dictionary && dictionary.datetime) {
            setLocalFromDate(dictionary.datetime.min);
            setLocalToDate(dictionary.datetime.max);
        }
    }, [dispatch, dictionary]);

    function handleSubmit() {
        // TODO restore the checks from history
        if (isNaN(localFromDate)) {
            setLocalFromDate(undefined);
        }
        if (isNaN(localToDate)) {
            setLocalToDate(undefined);
        }

        if (!localFromDate || !localToDate || localFromDate < localToDate) {
            dispatch(setFromDate(localFromDate));
            dispatch(setToDate(localToDate));
            dispatch(fetchFeatures() as any)
        }
    }

    function handleFromDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value: string | number = parseInt(e.target.value);
        // if (isNaN(value)) {
        //     value = '';
        // }
        setLocalFromDate(value);
    }

    function handleToDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        let value: string | number = parseInt(e.target.value);
        if (isNaN(value)) {
            value = '';
        }
        setLocalToDate(value);
    }

    return (
        <nav className='date-range component highlightable'>
            {pointsCount ? (
                <Link to="/histogram/dates">
                    <span className='grey calendar-icon' title={get('date_range.histogram-button')} aria-label={get('date_range.histogram-button')} />
                </Link>
            ) : (
                <span className='grey calendar-icon' title={get('date_range.title')} aria-label={get('date_range.title')} />
            )}
            <input
                title={get('date_range.min')}
                aria-label={get('date_range.min')}
                type='number'
                id='minYear'
                name='minYear'
                value={localFromDate === undefined ? '' : localFromDate}
                onChange={handleFromDateChange}
            />
            -
            <input
                title={get('date_range.max')}
                aria-label={get('date_range.max')}
                type='number'
                id='maxYear'
                name='maxYear'
                value={localToDate === undefined ? '' : localToDate}
                onChange={handleToDateChange}
            />

            <span className='submit' onClick={handleSubmit} title={get('date_range.submit')} aria-label={get('date_range.submit')}>▶</span>
        </nav>
    );
}

export default DateRange;
