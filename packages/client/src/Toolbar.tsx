// Toolbar.tsx
import React from 'react';

import DateRange from './Toolbar/DateRange';
import SearchText from './Toolbar/SearchText';
import ReportCtrl from './Toolbar/ReportCtrl'
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <ReportCtrl />
        <DateRange />
        <SearchText />
    </nav>)
}

export default Toolbar;