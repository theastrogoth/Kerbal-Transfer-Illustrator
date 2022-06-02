// import { HashRouter } from 'react-router-dom';
// import ReactDOM from 'react-dom';
// import App from './App';

// ReactDOM.render((
//   <HashRouter>
//     <App />,
//   </HashRouter>
//   ), document.getElementById('root')
// );

// Using BrowserRouter does not work with Github Pages, but it is necessary to avoid HashRouter if state will be stored in the URL hash.

import { BrowserRouter } from 'react-router-dom';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render((
  <BrowserRouter>
    <App />,
  </BrowserRouter>
  ), document.getElementById('root')
);

