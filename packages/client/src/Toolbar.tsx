// Toolbar.tsx
import React from 'react';

import DateRange from './Toolbar/DateRange';
import SearchText from './Toolbar/SearchText';
import ReportCount from './Toolbar/Status'
import DonwloadCsvButton from './Toolbar/DonwloadCsvButton';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <ReportCount />
        <DateRange />
        <SearchText />
        <DonwloadCsvButton />
    </nav>)
}

export default Toolbar;