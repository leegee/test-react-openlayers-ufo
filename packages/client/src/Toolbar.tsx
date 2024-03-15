// Toolbar.tsx
import React from 'react';

import DateRange from './Toolbar/DateRange';
import SearchText from './Toolbar/SearchText';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <DateRange />
        <SearchText />
        <span> Todo </span>
    </nav>)
}

export default Toolbar;