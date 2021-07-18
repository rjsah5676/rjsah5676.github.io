import React, { Component} from "react";
import { Route } from "react-router-dom";
import { createBrowserHistory } from "history";
import MainPage from "./Page/MainPage";
import MyInfo from "./Page/MyInfo";
import AlgoPage from "./Page/AlgoPage";
import aa from "./Page/aa";
import bb from "./Page/bb";
import cc from "./Page/cc";
import feffsx from "./Page/feffsx";
//import * as topFunc from './Top';
import './css/Transition.css';

class Body extends Component {
  render (){
    return (
            <div>
            <Route exact path="/" component={MainPage}></Route>
            <Route exact path="/info" component={MyInfo}></Route>
            <Route exact path="/algorithm" component={AlgoPage}></Route>
            <Route exact path="/ewfwfeff" component={feffsx}></Route>
            <Route exact path="/aa" component={aa}></Route>
            <Route exact path="/bb" component={bb}></Route>
            <Route exact path="/cc" component={cc}></Route>
            </div>
    );
  }
}

export default Body;
