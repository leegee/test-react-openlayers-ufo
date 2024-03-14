import React from 'react';

import './App.css';
import OpenLayersMap from './Map';
import Panel from './Panel';

const App: React.FC = () => {
  return (
    <div>
      <h1>Map</h1>
      <OpenLayersMap />
      <Panel />
    </div>
  );
}

export default App;
