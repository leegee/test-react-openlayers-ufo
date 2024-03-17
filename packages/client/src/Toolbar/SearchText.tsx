import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';
import debounce from 'debounce';

import { fetchFeatures, setQ } from '../redux/mapSlice';
import { RootState } from '../redux/types';

import './SearchText.css';

const DEBOUNCE_INPUT_MS = 500;

const SearchText: React.FC = () => {
    const dispatch = useDispatch();
    const { q } = useSelector((state: RootState) => state.map);
    const [localQ, setLocalQ] = useState<string>(q!);

    const debouncedDispatch = debounce((value: string) => {
        dispatch(setQ(value));
        dispatch(fetchFeatures() as any);
    }, DEBOUNCE_INPUT_MS);

    const handleQChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocalQ(value);
        debouncedDispatch(value);
    };

    return (
        <nav className='search-text component highlightable'>
            <span className='grey search-icon' />
            <input
                title={get('search_text.title')}
                type='search'
                id='q'
                name='q'
                value={localQ}
                onChange={handleQChange}
                placeholder={get('search_text.placeholder')}
            />
        </nav>
    );
}

export default SearchText;
