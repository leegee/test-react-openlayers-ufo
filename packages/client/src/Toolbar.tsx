// Toolbar.tsx
import React from 'react';

import DateRange from './Toolbar/DateRange';
import SearchText from './Toolbar/SearchText';
import ReportCount from './Toolbar/Status'
import DonwloadCsvButton from './Toolbar/DonwloadCsvButton';
import SourceSelector from './Toolbar/SourceSelector';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <ReportCount />
        <SourceSelector />
        <DateRange />
        <SearchText />
        <DonwloadCsvButton />
    </nav>)
}

export default Toolbar;