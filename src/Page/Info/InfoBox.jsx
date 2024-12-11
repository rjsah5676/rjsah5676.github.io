import React, { useState } from "react";
import {Link} from 'react-router-dom';

import gitImg from '../../img/Page/info/github.png';
import gitHoverImg from '../../img/Page/info/github_hover.png';
import pageOutImg from '../../img/Page/info/page_out.png';
import pageOutHoverImg from '../../img/Page/info/page_out_hover.png';

function InfoBox({imgLink, gitLink, title,desc,tech,idx}) {
    const [linkIndex, setLinkIndex] = useState(0);
    const [linkIndex2, setLinkIndex2] = useState(0);
    if(idx===4) return(
        <div className="info-item">
                  <Link to={{pathname:'infoPage', state: {idx: idx} }} style={{backgroundImage:`url(${imgLink})`}} className="info-image"/>
                  <Link to={{pathname:'infoPage', state: {idx: idx} }} className="info-title">{title}</Link>
                  <div className="info-desc">{desc}</div>
                  {tech}
                  <div className="info-link-test">
                  <a href={gitLink} onMouseOver={() => setLinkIndex(idx) }
                           onMouseOut={() => setLinkIndex(0)} style={linkIndex===idx? {backgroundImage:`url(${gitHoverImg})`}:{backgroundImage:`url(${gitImg})`}} className="info-link"> </a>
                   <a href="https://rjsah5676.github.io/" onMouseOver={() => setLinkIndex2(idx) }
                                              onMouseOut={() => setLinkIndex2(0)} style={linkIndex2===idx? {backgroundImage:`url(${pageOutHoverImg})`}:{backgroundImage:`url(${pageOutImg})`}} className="info-link"> </a>
        </div></div>
        );
    return (<div className="info-item">
          <Link to={{pathname:'infoPage', state: {idx: idx} }} style={{backgroundImage:`url(${imgLink})`}} className="info-image"/>
          <Link to={{pathname:'infoPage', state: {idx: idx} }} className="info-title">{title}</Link>
          <div className="info-desc">{desc}</div>
          {tech}
          <a href="{gitLink}" onMouseOver={() => setLinkIndex(idx) }
                   onMouseOut={() => setLinkIndex(0)} style={linkIndex===idx? {backgroundImage:`url(${gitHoverImg})`}:{backgroundImage:`url(${gitImg})`}} className="info-link"> </a>
      </div>);
}

export default InfoBox;