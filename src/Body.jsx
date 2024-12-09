import React, { Component} from "react";
import { Route } from "react-router-dom";
import { createBrowserHistory } from "history";
import MainPage from "./Page/MainPage";
import MyInfo from "./Page/MyInfo";
import AlgoPage from "./Page/AlgoPage";
import feffsx from "./Page/feffsx";
import './css/Transition.css';
import melongame from "./Page/melongame";
import infoPage from "./Page/InfoPage";
import ImagePage from "./Page/ImagePage";
import GuestBox from "./Page/GuestBox";
import About from "./Page/About";
import Archive from "./Page/Archive";

class Body extends Component {
  render (){
    return (
            <div>
            <Route exact path="/" component={MainPage}></Route>
            <Route exact path="/project" component={MyInfo}></Route>
            <Route exact path="/algorithm" component={AlgoPage}></Route>
            <Route exact path="/image" component={ImagePage}></Route>
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
