import React, { Component} from "react";
import { Route } from "react-router-dom";
import { createBrowserHistory } from "history";
import MainPage from "./Page/MainPage";
import MyInfo from "./Page/MyInfo";
import AlgoPage from "./Page/AlgoPage";
import aa from "./Page/melongame";
import bb from "./Page/bb";
import cc from "./Page/cc";
import feffsx from "./Page/feffsx";
import './css/Transition.css';
import melongame from "./Page/melongame";
import infoPage from "./Page/InfoPage";
import ImagePage from "./Page/ImagePage";
import GuestBox from "./Page/GuestBox";
import About from "./Page/About";

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
            </div>
    );
  }
}

export default Body;
