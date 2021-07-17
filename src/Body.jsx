import React, { Component} from "react";
import { Route } from "react-router-dom";
import MainPage from "./Page/MainPage";
import MyInfo from "./Page/MyInfo";
import AlgoPage from "./Page/AlgoPage";
import feffsx from "./Page/feffsx";
import * as topFunc from './Top';

class Body extends Component {
  render (){
    return (
      <div>
        <Route exact path="/" component={MainPage}></Route>
        <Route exact path="/info" component={MyInfo}></Route>
        <Route exact path="/algorithm" component={AlgoPage}></Route>
        <Route exact path="/ewfwfeff" component={feffsx}></Route>
      </div>
    );
  }
}

export default Body;
