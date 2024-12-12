import React from "react";
import Faded from "../../effect/Faded";
import '../../css/gallery.css';
import gallery_1 from '../../img/Gallery/gallery_1.png';
import gallery_2 from '../../img/Gallery/gallery_2.png';
import gallery_3 from '../../img/Gallery/gallery_3.png';
import gallery_4 from '../../img/Gallery/gallery_4.png';
import gallery_5 from '../../img/Gallery/gallery_5.png';
import gallery_6 from '../../img/Gallery/gallery_6.png';
import gallery_7 from '../../img/Gallery/gallery_7.png';
import gallery_8 from '../../img/Gallery/gallery_8.png';

function GalleryPage() {
    return (
      <Faded>
        <div className='gallery-container'>
          <div className='gallery-box'>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_1})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_2})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_3})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_4})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_5})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_6})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_7})`}}/>
              <div className='gallery-item' style={{backgroundImage:`url(${gallery_8})`}}/>
          </div>
        </div>
      </Faded>
    );
}

export default GalleryPage;
