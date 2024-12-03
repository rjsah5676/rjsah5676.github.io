import React, { Component} from "react";
import Faded from "../effect/Faded";
import '../css/Page/info.css';
import airBoardImg from '../img/Page/info/AirBoard.png';

class MyInfo extends Component {
  render (){
    return (
      <Faded>
        <div className="info-wrap">
              <div className="info-container">
                  <div className="info-item">
                      <div style={{backgroundImage:`url(${airBoardImg})`}} className="info-image">
                          a
                      </div>
                      <div className="b">캠 필기 웹 화상 회의 서비스 [AirBoard]</div>
                      <div className="c">c</div>
                      <div className="d">d</div>
                      <div className="e">e</div>
                  </div>
                  <div className="info-item">
                      <div className="info-image">a</div>
                      <div className="b">요리 리뷰 사이트 [요리조리]</div>
                      <div className="c">c</div>
                      <div className="d">d</div>
                      <div className="e">e</div>
                  </div>
                    <div className="info-item">
                        <div className="info-image">a</div>
                        <div className="b">b</div>
                        <div className="c">c</div>
                        <div className="d">d</div>
                        <div className="e">e</div>
                    </div>
                    <div className="info-item">
                        <div className="info-image">a</div>
                        <div className="b">b</div>
                        <div className="c">c</div>
                        <div className="d">d</div>
                        <div className="e">e</div>
                    </div>
                    <div className="info-item">
                        <div className="info-image">a</div>
                        <div className="b">b</div>
                        <div className="c">c</div>
                        <div className="d">d</div>
                        <div className="e">e</div>
                    </div>
              </div>
          <div style={{height:'50px'}}></div>
        </div>
      </Faded>
    );
  }
}

export default MyInfo;
