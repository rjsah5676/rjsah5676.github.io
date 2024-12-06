import React, { useState, Component} from "react";
import {Link} from 'react-router-dom';

import gitImg from '../img/Page/info/github.png';
import gitHoverImg from '../img/Page/info/github_hover.png';

function InfoBox({imgLink, gitLink, title,desc,tech,idx}) {
    const [linkIndex, setLinkIndex] = useState(0);

    return (<div className="info-item">
          <Link to={{pathname:'infoPage', state: {idx: idx} }} style={{backgroundImage:`url(${imgLink})`}} className="info-image"/>
          <Link to={{pathname:'infoPage', state: {idx: idx} }} className="info-title">{title}</Link>
          <div className="info-desc">{desc}</div>
          {tech}
          <a href={gitLink} onMouseOver={() => setLinkIndex(idx) }
                   onMouseOut={() => setLinkIndex(0)} style={linkIndex===idx? {backgroundImage:`url(${gitHoverImg})`}:{backgroundImage:`url(${gitImg})`}} className="info-link"/>
      </div>);
}

export default InfoBox;