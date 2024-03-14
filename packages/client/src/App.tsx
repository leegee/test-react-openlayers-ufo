import React from 'react';

import FeatureTable from './FeaturesTable';
import Map from './Map';
import Panel from './Panel';
import Toolbar from './Toolbar';

import './App.css';

const App: React.FC = () => {
  return (
    <div>
      <Toolbar />
      <Map />
      <Panel >
        <FeatureTable />
      </Panel>

    </div>
  );
}

export default App;
