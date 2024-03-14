// Toolbar.tsx
import React from 'react';

import DateRange from './Toolbar/DateRange';
import './Toolbar.css';

const Toolbar: React.FC = () => {
    return (<nav className='toolbar'>
        <DateRange />
        <span> Type </span>
        <span> Text </span>
    </nav>)
}

export default Toolbar;