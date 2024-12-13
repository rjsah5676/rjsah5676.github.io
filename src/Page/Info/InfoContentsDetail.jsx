import React from "react";
import '../../css/Page/info.css';

function InfoContentsDetail({title, text}) {
    return(
        <div>
            <div className='detail-title'>{title}</div>
            <pre className='detail-text'>{text}</pre>
        </div>
    );
}

export default InfoContentsDetail;