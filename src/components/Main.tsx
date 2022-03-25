import {Routes, Route } from 'react-router-dom';

import TransferApp from '../TransferApp';
import FlybyApp from '../FlybyApp';

function Main() {
  return (
    <Routes>
      <Route path='/' element={<TransferApp />} />
      <Route path='/Flyby/' element={<FlybyApp />} />
    </Routes>
  );
}

export default Main;