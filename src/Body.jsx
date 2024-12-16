import React, { Component} from "react";
import { Route } from "react-router-dom";
import { createBrowserHistory } from "history";
import MainPage from "./Page/MainPage";
import MyInfo from "./Page/Info/MyInfo";
import feffsx from "./Page/feffsx";
import './css/Transition.css';

import melongame from "./Page/melongame";
import infoPage from "./Page/Info/InfoPage";
import GalleryPage from "./Page/Gallery/GalleryPage";
import GuestBox from "./Page/GuestBox";
import About from "./Page/About";
import Archive from "./Page/Archive/Archive";

class Body extends Component {
  render (){
    return (
            <div>
            <Route exact path="/" component={MainPage}></Route>
            <Route exact path="/project" component={MyInfo}></Route>
            <Route exact path="/gallery" component={GalleryPage}></Route>
            <Route exact path="/guest" component={GuestBox}></Route>
            <Route exact path="/melongame" component={melongame}></Route>
            <Route exact path="/about" component={About}></Route>
            <Route exact path="/infoPage" component={infoPage}></Route>
            <Route exact path="/archive" component={Archive}></Route>
            </div>
    );
  }
}

export default Body;
