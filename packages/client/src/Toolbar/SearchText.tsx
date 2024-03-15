import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import debounce from 'debounce';

import { fetchFeatures, setQ } from '../redux/mapSlice';
import { RootState } from '../redux/types';

import './SearchText.css';
import { get } from 'react-intl-universal';

const DEBOUNCE_FETCH_MS = 900;

const SearchText: React.FC = () => {
    const dispatch = useDispatch();
    const { q } = useSelector((state: RootState) => state.map);

    const debouncedFetchFeatures = debounce(() => dispatch(fetchFeatures() as any), DEBOUNCE_FETCH_MS);

    useEffect(() => {
        debouncedFetchFeatures();
    }, [dispatch, q]);

    const handleQChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value === undefined && value !== '') {
            dispatch(setQ(value));
        } else {
            console.warn('no q');
        }
    };

    return (
        <aside className='search-text component'>
            <input
                title={get('search_text.title')}
                type='text'
                id='q'
                name='q'
                value={q}
                onChange={handleQChange}
            />
            <span className='grey search-icon' />
        </aside>
    );
}

export default SearchText;
