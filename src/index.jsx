import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter} from 'react-router-dom';
import Header from './Header';
import Nav from './Nav';
import Body from './Body';

ReactDOM.render(
  <div>
    <HashRouter>
      <Header/>
      <Nav/>
      <Body/>
    </HashRouter>
  </div>,
  document.querySelector('#container')
);