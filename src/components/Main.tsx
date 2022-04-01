import {Routes, Route } from 'react-router-dom';

import TransferApp from '../TransferApp';
import FlybyApp from '../FlybyApp';
import ManeuversApp from '../ManeuversApp';

function Main() {
  return (
    <Routes>
      <Route path='/' element={<TransferApp />} />
      <Route path='/Flyby/' element={<FlybyApp />} />
      <Route path='/Maneuvers/' element={<ManeuversApp />} />
    </Routes>
  );
}

export default Main;