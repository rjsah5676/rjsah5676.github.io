import React , {useState,useEffect} from "react";
import FadeIn from "../../effect/FadeIn";
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
    function clickImg(i) {
        if(!clicked) {
            setClicked(true);
            setImgInfo(i);
        }
    }
    function clickExit() {
        setClicked(false);
    }
    const arr = [gallery_1, gallery_2, gallery_3, gallery_4, gallery_5, gallery_6, gallery_7, gallery_8];
    const [clicked, setClicked] = useState(false);
    const [imgInfo, setImgInfo] = useState(0);
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
              <div onClick={() => clickImg(0)} className='gallery-item' style={{backgroundImage:`url(${gallery_1})`}}/>
              <div onClick={() => clickImg(1)} className='gallery-item' style={{backgroundImage:`url(${gallery_2})`}}/>
              <div onClick={() => clickImg(2)} className='gallery-item' style={{backgroundImage:`url(${gallery_3})`}}/>
              <div onClick={() => clickImg(3)} className='gallery-item' style={{backgroundImage:`url(${gallery_4})`}}/>
              <div onClick={() => clickImg(4)} className='gallery-item' style={{backgroundImage:`url(${gallery_5})`}}/>
              <div onClick={() => clickImg(5)} className='gallery-item' style={{backgroundImage:`url(${gallery_6})`}}/>
              <div onClick={() => clickImg(6)} className='gallery-item' style={{backgroundImage:`url(${gallery_7})`}}/>
              <div onClick={() => clickImg(7)} className='gallery-item' style={{backgroundImage:`url(${gallery_8})`}}/>
          </div>
        </div>
      </FadeIn>
    );
}

export default GalleryPage;
