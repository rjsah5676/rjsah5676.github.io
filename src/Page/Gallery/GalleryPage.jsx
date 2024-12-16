import React , {useState,useEffect} from "react";
import FadeIn from "../../effect/FadeIn";
import Faded from "../../effect/Faded";

import gallery_1 from '../../img/Gallery/gallery_1.png';
import gallery_2 from '../../img/Gallery/gallery_2.png';
import gallery_3 from '../../img/Gallery/gallery_3.png';
import gallery_4 from '../../img/Gallery/gallery_4.png';
import gallery_5 from '../../img/Gallery/gallery_5.png';
import gallery_6 from '../../img/Gallery/gallery_6.png';
import gallery_7 from '../../img/Gallery/gallery_7.png';
import gallery_8 from '../../img/Gallery/gallery_8.png';
import gallery_9 from '../../img/Gallery/gallery_9.png';
import gallery_10 from '../../img/Gallery/gallery_10.png';
import gallery_11 from '../../img/Gallery/gallery_11.png';
import gallery_12 from '../../img/Gallery/gallery_12.png';
import gallery_13 from '../../img/Gallery/gallery_13.png';
import gallery_14 from '../../img/Gallery/gallery_14.png';
import gallery_15 from '../../img/Gallery/gallery_15.png';
import gallery_16 from '../../img/Gallery/gallery_16.png';

function GalleryPage() {
    function clickImg(i) {
        if(!clicked) {
            setClicked(true);
            setImgInfo(i);
        }
    }
    function clickExit() {
        setClicked(false);
    }
    function goPage(i) {
        if(i==1) setPage(page+1);
        else if(page>0) setPage(page-1);
    }
    const imgRender = () => {
        const res = [];
        for(let i=0+8*page; i<8+8*page;i++) {
          res.push(<div onClick={() => clickImg(i)} className='gallery-item' style={{backgroundImage:`url(${arr[i]})`}}/>);
        }
        return res;
    }
    const arr = [gallery_1, gallery_2, gallery_3, gallery_4, gallery_5, gallery_6, gallery_7, gallery_8, gallery_9, gallery_10, gallery_11, gallery_12, gallery_13, gallery_14, gallery_15, gallery_16];
    const [clicked, setClicked] = useState(false);
    const [imgInfo, setImgInfo] = useState(0);
    const [page, setPage] = useState(0);

    return (
      <FadeIn>
        <div className='gallery-container'>
            <FadeIn duration={0} style={{display: !clicked ? 'none' :'block'}}>
                <div className='clicked-img-box'>
                    <div className='clicked-img' style={{backgroundImage:`url(${arr[imgInfo]})`}}/>
                    <div className='exit-button' onClick={clickExit}/>
                </div>
            </FadeIn>
          <div className='gallery-box'>
              {imgRender()}
          </div>
          <div className='gallery-page-button'>
              <div className='gallery-left-button' onClick={()=> goPage(-1)}/>
              <div className='gallery-page'>{page+1}</div>
              <div className='gallery-right-button' onClick={()=> goPage(1)}/>
          </div>
        </div>
      </FadeIn>
    );
}

export default GalleryPage;
