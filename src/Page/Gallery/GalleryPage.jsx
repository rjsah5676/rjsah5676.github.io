import React , {useState,useEffect} from "react";
import FadeIn from "../../effect/FadeIn";

import img_1 from '../../img/Gallery/img_1.jpg';
import img_2 from '../../img/Gallery/img_2.jpg';
import img_3 from '../../img/Gallery/img_3.jpg';
import img_4 from '../../img/Gallery/img_4.jpg';
import img_5 from '../../img/Gallery/img_5.jpg';
import img_6 from '../../img/Gallery/img_6.jpg';
import img_7 from '../../img/Gallery/img_7.jpg';
import img_8 from '../../img/Gallery/img_8.jpg';
import img_9 from '../../img/Gallery/img_9.jpg';
import img_10 from '../../img/Gallery/img_10.jpg';
import img_11 from '../../img/Gallery/img_11.jpg';
import img_12 from '../../img/Gallery/img_12.jpg';
import img_13 from '../../img/Gallery/img_13.jpg';
import img_14 from '../../img/Gallery/img_14.jpg';
import img_15 from '../../img/Gallery/img_15.jpg';
import img_16 from '../../img/Gallery/img_16.jpg';
import img_17 from '../../img/Gallery/img_17.jpg';
import img_18 from '../../img/Gallery/img_18.jpg';
import img_19 from '../../img/Gallery/img_19.jpg';
import img_20 from '../../img/Gallery/img_20.jpg';

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
    const IMAGE_NUM=17;

    const arr = [img_1, img_2, img_3, img_4, 
        img_5, img_6, img_7, img_8, img_9, 
        img_10, img_11, img_12, img_13, img_14, 
        img_15, img_16, img_17, img_18, img_19, img_20];

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
