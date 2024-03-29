import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { get } from 'react-intl-universal';
import debounce from 'debounce';

import config from '@ufo-monorepo-test/config/src';
import { setQ, setUpdateMap } from '../redux/mapSlice';
import { RootState } from '../redux/store';

import './SearchText.css';

const DEBOUNCE_INPUT_MS = 500;

const SearchText: React.FC = () => {
    const dispatch = useDispatch();
    const { q } = useSelector((state: RootState) => state.map);
    const [localQ, setLocalQ] = useState<string>(q!);

    const debouncedFetchRequest = debounce((value: string) => {
        if (value.trim().length === 0 || value.length > config.minQLength) {
            dispatch(setQ(value));
            dispatch((setUpdateMap(true)));
        }
    }, DEBOUNCE_INPUT_MS);

    const handleQChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setLocalQ(value);
        debouncedFetchRequest(value);
    };

    return (
        <nav className='search-text component highlightable'>
            <span className='grey search-icon' />
            <input
                title={get('search_text.title', { maxChars: config.minQLength })}
                aria-label={get('search_text.title', { maxChars: config.minQLength })}
                type='search'
                id='q'
                name='q'
                value={localQ}
                onChange={handleQChange}
                minLength={config.minQLength}
                placeholder={get('search_text.placeholder')}
            />
        </nav>
    );
}

export default SearchText;
