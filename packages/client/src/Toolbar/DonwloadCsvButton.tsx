// DonwloadCsvButton
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { fetchCsv } from '../redux/mapSlice';

import './DonwloadCsvButton.css';


const DonwloadCsvButton: React.FC = () => {
    const dispatch = useDispatch();
    const { requestingCsv } = useSelector((state: RootState) => state.map);

    const download = () => {
        dispatch(fetchCsv('csv'));
    };

    return (
        <button title='CSV' aria-label='CSV' disabled={requestingCsv} onClick={download} className='download-csv-button grey component highlightable' />
    );
}

export default DonwloadCsvButton;
