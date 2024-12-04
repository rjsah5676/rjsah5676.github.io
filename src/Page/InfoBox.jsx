import React, { useState, Component} from "react";
import {Link} from 'react-router-dom';

import airBoardImg from '../img/Page/info/AirBoard.png';
import yoriJoriImg from '../img/Page/info/YoriJori.png';
import gitImg from '../img/Page/info/github.png';
import testImg from '../img/Page/info/Test.png';
import gitHoverImg from '../img/Page/info/github_hover.png';
import logoImg from '../img/Page/info/logo.PNG';

function InfoBox({imgLink, gitLink, title,desc,tech,idx}) {
    const [linkIndex, setLinkIndex] = useState(0);

    return (<div className="info-item">
          <Link to={{pathname:'infoPage', state: {idx: idx} }} style={{backgroundImage:`url(${imgLink})`}} className="info-image"/>
          <Link to={{pathname:'infoPage', state: {idx: idx} }} className="info-title">{title}</Link>
          <div className="info-desc">{desc}</div>
          <div className="info-tech"><pre>{tech}</pre></div>
          <a href={gitLink} onMouseOver={() => setLinkIndex(idx) }
                   onMouseOut={() => setLinkIndex(0)} style={linkIndex===idx? {backgroundImage:`url(${gitHoverImg})`}:{backgroundImage:`url(${gitImg})`}} className="info-link"/>
      </div>);
}

export default InfoBox;