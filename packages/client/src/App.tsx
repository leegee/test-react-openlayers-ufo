import React, { useEffect } from 'react';

import { REPORT_FULL_WIDTH, REPORT_NARROW_WIDTH } from './custom-events/report-width';
import FeatureTable from './FeaturesTable';
import Map from './Map';
import Panel from './ResultsPanel';
import Toolbar from './Toolbar';

import './App.css';

const App: React.FC = () => {
  useEffect(() => {
    document.addEventListener(REPORT_FULL_WIDTH, () => {
      document.body.classList.add(REPORT_FULL_WIDTH);
      document.body.classList.remove(REPORT_NARROW_WIDTH);
    });
    document.addEventListener(REPORT_NARROW_WIDTH, () => {
      document.body.classList.remove(REPORT_FULL_WIDTH);
      document.body.classList.add(REPORT_NARROW_WIDTH);
    });
  }, []);

  return (
    <>
      <Toolbar />
      <div className='map-panel-container'>
        <Map />
        <Panel >
          <FeatureTable />
        </Panel>
      </div>
    </>
  );
}

export default App;
