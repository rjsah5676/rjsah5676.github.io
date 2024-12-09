import React, { useState, Component} from "react";
import Faded from "../effect/Faded";
import '../css/guestBox.css';
import firebase from "../firebase";
const db = firebase.firestore();

function GuestBox() {
    const [list, setList] = useState('');

    const [name, setName] = useState('');
    const [contents, setContents] = useState('');

    //꼭 컴포넌트 디드마운트해보기
    db.collection('guest').get()
                    .then((querySnapshot) => {
                      querySnapshot.forEach((doc) => {
                          console.log(doc.data().name);
                          //setList([{name:doc.data().name, contents:doc.data().contents}]);
                      });
                    })

    console.log("!");
    const onChangeName = (event) => {
        setName(event.target.value);
    };
    const onChangeContents = (event) => {
        setContents(event.target.value);
    };
    function makeBox(){
        return (<li className="guest-chat-box">
                              <div class="container">
                                  <div className='message-who'>이건모</div>
                               <div class="message-container">
                                 <div class='message-box'>
                                   <p>아직은 작성이 안됩니다. 입력 ㄴㄴ</p>
                                 </div>
                               </div>
                             </div></li>);
    }
    function submitGuest(){
        if(name!=="" && contents!=="") {
            db.collection("guest").add({name:name, contents:contents});
            setName("");
            setContents("");
        }
    }

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
                    {makeBox()}
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
                    <input className='guest-input-name' onChange={onChangeName} value={name}></input>
                    <button className='guest-input-button' onClick={submitGuest}>등록</button>
                    <input className='guest-input-info' onChange={onChangeContents} value={contents}></input>
                </div>
            </div>
            <div className='guest-home-button'/>
        </div>
      </Faded>
    );
}

export default GuestBox;
