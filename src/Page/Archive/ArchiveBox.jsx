import React from 'react';
import '../../css/archive.css';

function ArchiveBox({date, text}) {
    return(
        <div className='archive-box'>
            <div className='archive-date'>{date}</div>
            <div className='archive-text'>{text}</div>
        </div>
    );
}

export default ArchiveBox;