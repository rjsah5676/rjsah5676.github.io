import React from "react";
import '../../css/Page/info.css';

function InfoContentsDetail({title, text}) {
    return(
        <div>
            <div className='detail-title'>{title}</div>
            <div className='detail-text'>{text}</div>
        </div>
    );
}

export default InfoContentsDetail;