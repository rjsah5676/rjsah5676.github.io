import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter} from 'react-router-dom';
import Header from './Header';
import Nav from './Nav';
import Body from './Body';
import Footer from './Footer';
import Top from './Top';

ReactDOM.render(
  <div>
    <HashRouter>
      <Top/>
      <Header/>
      <Nav/>
      <Body />
      <Footer/>
    </HashRouter>
  </div>,
  document.querySelector('#container')
);