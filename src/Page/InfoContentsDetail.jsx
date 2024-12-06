import React, { useState, Component} from "react";
import '../css/Page/info.css';

function InfoContentsDetail({title, text}) {
    return(
        <div>
            <div>{title}</div>
            <div>{text}</div>
        </div>
    );
}

export default InfoContentsDetail;