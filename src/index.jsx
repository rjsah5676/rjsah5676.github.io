import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import Header from './Header';
import Nav from './Nav';
import Body from './Body';
import Footer from './Footer';
import Top from './Top';
import Contact from './Contact';

import './css/index.css';
import './css/gallery.css';
import './css/nav.css';
import './css/header.css';
import './css/footer.css';
import './css/Page/mainPage.css';
import './css/Page/rspeed.css';
import './css/guestBox.css';
import './css/about.css';
import './css/top.css';
import './css/Page/info.css';
import './css/archive.css';
import './css/Page/melon.css';
import './css/Page/sketch.css';
import './css/minesweeper.css';
ReactDOM.render(
  <HashRouter>
    <Top />
    <Header />
    <Nav />
    <Body />
    <Footer />
    <Contact />
  </HashRouter>,
  document.querySelector('#container')
);
