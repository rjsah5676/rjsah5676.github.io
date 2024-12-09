import React, { Component} from "react";
import Faded from "../effect/Faded";
import '../css/guestBox.css';

function GuestBox() {
    return (
      <Faded>
        <div className="guest-wrap">
            <div className="guest-body">
                <ol>
                <li className="guest-chat-box">
                    <div class="container">
                        <div className='message-who'>이건모</div>
                     <div class="message-container">
                       <div class='message-box'>
                         <p>아직은 작성이 안됩니다. 입력 ㄴㄴ</p>
                       </div>
                     </div>
                   </div></li>
                <li className="guest-chat-box"><div class="container">
                    <div className='message-who'>이건모</div>
                    <div class="message-container">
                      <div class='message-box'>
                        <p>테스트입니다.</p>
                      </div>
                    </div>
                  </div></li>
                <li className="guest-chat-box"><div class="container">
                    <div className='message-who'>이건모</div>
                    <div class="message-container">
                      <div class='message-box'>
                        <p>반가워요</p>
                      </div>
                    </div>
                  </div></li>
                </ol>
                <div className='guest-page-button'>
                    <div className='guest-left-button'/>
                    <div className='guest-right-button'/>
                </div>
                <div className='guest-input-box'>
                    <div className='guest-nm'>이름</div>
                    <input className='guest-input-name'></input>
                    <button className='guest-input-button'>등록</button>
                    <input className='guest-input-info'></input>
                </div>
            </div>
            <div className='guest-home-button'/>
        </div>
      </Faded>
    );
}

export default GuestBox;
