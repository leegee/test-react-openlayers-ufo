import React from 'react';

import FeatureTable from './FeaturesTable';
import Map from './Map';
import Panel from './ResultsPanel';
import Toolbar from './Toolbar';

import './App.css';

const App: React.FC = () => {
  return (
    <div>
      <Toolbar />
      <div className='map-panel-container'>
        <Map />
        <Panel >
          <FeatureTable />
        </Panel>
      </div>
    </div>
  );
}

export default App;
