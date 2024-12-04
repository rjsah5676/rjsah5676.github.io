import React, { useState, Component} from "react";
import {useLocation} from 'react-router-dom';
import Faded from "../effect/Faded";

function InfoPage() {
    const location = useLocation();

    return (
        <Faded>
            일단 테스트{location.state.idx} dd
        </Faded>
    )
}

export default InfoPage;