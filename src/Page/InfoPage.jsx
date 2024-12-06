import React, { useState, Component} from "react";
import {useLocation} from 'react-router-dom';
import Faded from "../effect/Faded";
import InfoContents from './InfoContents';

function InfoPage() {
    const location = useLocation();
    function getContents() {
        if(location.state !== undefined){
            for(var i=1;i<=100;i++) if(i==location.state.idx) return (<InfoContents idx={i}/>)
        }
        else window.location.href='#/info';
    }
    return (
        <Faded>
            <div style={{marginBottom:'100px'}}>
                <div className="info-container">
                    {getContents()}
                </div>
            </div>
        </Faded>
    )
}

export default InfoPage;