import React, { Component } from 'react';
import { Route } from "react-router-dom";
import TopHome from './Page/Top/TopHome';
import TopNone from './Page/Top/TopNone'
class Top extends Component {
    render() {   
        return(
            <div>
                <Route exact path="/" component={TopHome}></Route>
                <Route path="/info" component={TopNone}></Route>
                <Route path="/algorithm" component={TopNone}></Route>
                <Route path="/melongame" component={TopNone}></Route>
                <Route path="/bb" component={TopNone}></Route>
                <Route path="/cc" component={TopNone}></Route>
                <Route path="/infoPage" component={TopNone}></Route>
            </div>
        );
    };
}

export default Top;