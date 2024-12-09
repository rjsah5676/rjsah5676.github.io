import React, { Component } from 'react';
import { Route, useLocation } from "react-router-dom";
import TopHome from './Page/Top/TopHome';
import TopNone from './Page/Top/TopNone';

function Top() {
    const location = useLocation();

    if(location.pathname==='/') return(<div><Route exact path="/" component={TopHome}></Route></div>);
    else return(
        <div>
            <Route component={TopNone}></Route>
        </div>
    );
}

export default Top;