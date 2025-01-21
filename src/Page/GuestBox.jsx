import React, { useState,useEffect } from "react";
import Faded from "../effect/Faded";
import firebase from "../firebase";

const db = firebase.firestore();
const today = new Date();

function GuestBox() {
    const [list, setList] = useState([]);
    const [name, setName] = useState('');
    const [contents, setContents] = useState('');
    const [page, setPage] = useState(0);
    const [cnt, setCnt] = useState(0);

    useEffect(async()=>{
        var j = 1;
        await db.collection('guest').orderBy('id','desc').get()
            .then(async (querySnapshot) => {
              await querySnapshot.forEach((doc) => {
                      list.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
              });
            });
            setCnt(j);
        },[]);

    const onChangeName = (event) => {
        setName(event.target.value);
    };
    const onChangeContents = (event) => {
        setContents(event.target.value);
    };

    function goHomePage(){
        document.getElementsByClassName('guest-body')[0].scrollTo({top:0,left:0,behavior:'smooth'});
    }
    async function submitGuest(){
        if(name!=="" && contents!=="" && contents.length <50) {
            var date = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일  ${today.getHours()}:${today.getMinutes()}`;
            await db.collection("guest").add({name:name, contents:contents, id:today.getTime(), date:date});
            setCnt(cnt+1);
            setName("");
            setContents("");
            setPage(0);
            var newList=[];
            await db.collection('guest').orderBy('id','desc').get()
                .then( (querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                    newList.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
                  });
                });
            setList(newList);
            document.getElementsByClassName('guest-body')[0].scrollTo({top:0,left:0,behavior:'smooth'});
        }
    }

    function makeBox(){
        const listItems = list.map((item) =>
            (
            <li className="guest-chat-box"><div className="container">
                <div className='message-who'>{item.name}</div>
                <div className="message-container">
                  <div className='message-box'>
                    <ul>
                        <li className="message-date">
                            {item.date}
                        </li>
                        <li className="message-text">
                            {item.contents}
                        </li>
                    </ul>
                  </div>
                </div>
              </div></li>
        ));
        return (listItems);
    }
    return (
      <Faded>
        <div className="guest-wrap">
            <div className="guest-body">
                <ol>
                    {makeBox()}
                </ol>
            </div>
                <div className='guest-input-box'>
                    <div className='guest-nm'>이름</div>
                    <input className='guest-input-name' onChange={onChangeName} value={name}></input>
                    <button className='guest-input-button' onClick={submitGuest}>등록</button>
                    <input className='guest-input-info' onChange={onChangeContents} value={contents}></input>
                </div>
                <div className='guest-home-button' onClick={goHomePage}>□</div>
            </div>
      </Faded>
    );
}

export default GuestBox;
