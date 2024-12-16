import React from "react";
import '../../css/Page/info.css';

function InfoContentsDetail({title, text, titleFont, titleMargin}) {
    const titleStyle = {
            fontSize: titleFont,
            marginTop: titleMargin
        }
    return(
        <div>
            <div className='detail-title' style={titleStyle}>{title}</div>
            <pre className='detail-text'>{text}</pre>
        </div>
    );
}

export default InfoContentsDetail;