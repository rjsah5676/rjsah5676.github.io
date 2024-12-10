import React, { useState,useEffect, Component} from "react";
import Faded from "../effect/Faded";
import '../css/guestBox.css';
import firebase from "../firebase";

const db = firebase.firestore();
const today = new Date();

function GuestBox() {
    const [list, setList] = useState([]);
    const [done, setDone] = useState(0);
    const [name, setName] = useState('');
    const [contents, setContents] = useState('');
    const [page, setPage] = useState(0);
    const [cnt, setCnt] = useState(0);

    useEffect(async()=>{
        var i = page*5;
        var j = 1;
        await db.collection('guest').orderBy('id','desc').get()
            .then(async (querySnapshot) => {
              await querySnapshot.forEach((doc) => {
                  if(j>i && j<=i+5) {
                      list.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
                  }
                  j++;
              });
            });
            setCnt(j);
            //setDone();
        },[]);

    const onChangeName = (event) => {
        setName(event.target.value);
    };
    const onChangeContents = (event) => {
        setContents(event.target.value);
    };

    async function goLeftPage(){
        if(page>0) {
            setPage(page-1);
            var newList=[];
            var i = (page-1)*5;
            var j = 1;
            await db.collection('guest').orderBy('id','desc').get()
                .then( (querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                      if(j>i && j<=i+5) {
                          console.log(doc);
                          newList.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
                      }
                      j++;
                  });
                });
            setList(newList);
        }
    }

    async function goRightPage(){
        setPage(page+1);
        var newList=[];
        var i = (page+1)*5;
        var j = 1;
        await db.collection('guest').orderBy('id','desc').get()
            .then( (querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  if(j>i && j<=i+5) {
                      newList.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
                  }
                  j++;
              });
            });
        setList(newList);
    }

    async function goHomePage(){
        setPage(0);
        var newList=[];
        var i = 0;
        var j = 1;
        await db.collection('guest').orderBy('id','desc').get()
            .then( (querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  if(j>i && j<=i+5) {
                      newList.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
                  }
                  j++;
              });
            });
        setList(newList);
    }
    async function submitGuest(){
        if(name!=="" && contents!=="") {
            var date = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일  ${today.getHours()}:${today.getMinutes()}`;
            await db.collection("guest").add({name:name, contents:contents, id:cnt, date:date});
            setCnt(cnt+1);
            setName("");
            setContents("");
            setPage(0);
            var newList=[];
            var i = 0;
            var j = 1;
            await db.collection('guest').orderBy('id','desc').get()
                .then( (querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                      if(j>i && j<=i+5) {
                          newList.push({name:doc.data().name, contents:doc.data().contents, date:doc.data().date});
                      }
                      j++;
                  });
                });
            setList(newList);
        }
    }

    function makeBox(){
        const listItems = list.map((item) =>
            (
            <li className="guest-chat-box"><div class="container">
                <div className='message-who'>{item.name}</div>
                <div class="message-container">
                  <div class='message-box'>
                    <p><div style={{fontSize:'13px'}}>{item.date}</div>{item.contents}</p>
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
                <div className='guest-page-button'>
                    <div className='guest-left-button' onClick={goLeftPage}/>
                    <div className='guest-page'>{page+1}</div>
                    <div className='guest-right-button' onClick={goRightPage}/>
                </div>
                <div className='guest-input-box'>
                    <div className='guest-nm'>이름</div>
                    <input className='guest-input-name' onChange={onChangeName} value={name}></input>
                    <button className='guest-input-button' onClick={submitGuest}>등록</button>
                    <input className='guest-input-info' onChange={onChangeContents} value={contents}></input>
                </div>
            </div>
            <div className='guest-home-button' onClick={goHomePage}/>
        </div>
      </Faded>
    );
}

export default GuestBox;
