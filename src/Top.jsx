import React, { Component } from 'react';
import { Route } from "react-router-dom";
import TopHome from './Page/Top/TopHome';
import TopNone from './Page/Top/TopNone'

class Top extends Component {
    render() {   
        return(
            <div>
                <Route exact path="/" component={TopHome}></Route>
                <Route exact path="/info" component={TopNone}></Route>
                <Route exact path="/algorithm" component={TopNone}></Route>
                <Route exact path="/aa" component={TopNone}></Route>
                <Route exact path="/bb" component={TopNone}></Route>
                <Route exact path="/cc" component={TopNone}></Route>
            </div>
        );
    };
}

export default Top;