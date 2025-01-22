import React, {useEffect, useState} from 'react';
import Faded from "../../../effect/Faded";

import firebase from "../../../firebase";

const db = firebase.firestore();


function Sketch() {
    const [name, setName] = useState('');
    const [idx, setIdx] = useState(0);
    const [room,setRoom] = useState('');
    const [list, setList] = useState([]);
    const [roomnum,setRoomnum] = useState(0);
    const [chatList, setChatList] = useState([]);
    const [chat, setChat] = useState('');
    const [join, setJoin] = useState(0);

    useEffect(()=>{
        renderList();
        },[]);
    
    useEffect(()=> {
        if(document.getElementById("room-chat") !== null) {
            document.getElementById("room-chat").innerHTML = "";
            chatList.map((item) =>
            { document.getElementById("room-chat").innerHTML+= "<div>"+item.chatname+": "+item.text+"</div>"});
        }
    },[chatList]);

    async function submitName(username) {
        var cnt=1;
        var isDup=false;
        await db.collection("sketch_user").get()
        .then(async (querySnapshot) => {
          querySnapshot.forEach((doc) => {
              if(doc.data().name === username) {
                isDup=true;
              }
              cnt++;
          });
        });
        if(name !== ""&& name.length<10&& !isDup) {
            await db.collection("sketch_user").add({name:username, num:cnt});
        }
        setIdx(1);
    }

    const onChangeName = (event) => {
        setName(event.target.value);
    };

    const onChangeRoom = (event) => {
        setRoom(event.target.value);
    };

    const onChangeChat = (event) => {
        setChat(event.target.value);
    };

    async function createRoom(c_room,c_name) {
        var cnt=1;
        await db.collection("sketch_user_room").get()
        .then(async (querySnapshot) => {
          querySnapshot.forEach((doc) => {
              cnt++;
          });
        });
        if(c_room !== ""&& c_room.length<20) {
            await db.collection("sketch_user_room").add({num:cnt,roomname:c_room,name:c_name});
        }
        renderList();
        setRoomnum(cnt);
    }
    async function renderList() {
        await db.collection('sketch_user_room').orderBy('num','asc').get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                    list.push({num:doc.data().num, roomname:doc.data().roomname, name:doc.data().name});
              });
            });
    }
    async function renderChat() {
        var newList=[];
        await db.collection('sketch_user_chat').orderBy('num','asc').get()
            .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                    if(doc.data().chatroom === roomnum)
                        newList.push({num:doc.data().num, chatname:doc.data().chatname, text:doc.data().text});
              });
            });
        setChatList(newList);
        setJoin(1);
    }
    async function sendChat(s_room,s_name,s_text) {
        var cnt=1;
        await db.collection("sketch_user_chat").get()
        .then(async (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            if(s_room===doc.data().room) cnt++;
          });
        });
        if(s_text !== ""&& s_text.length<20) {
            await db.collection("sketch_user_chat").add({num:cnt,chatname:s_name,text:s_text,chatroom:s_room,date:new Date()});
            setChat('');
            renderChat();
        }
    }
    function makeBox(){
        const listItems = list.map((item) =>
            (
                <ul>
                <li>{item.num}</li>
                <li style={{cursor:'pointer'}} onClick={()=>{setRoomnum(item.num)}}>{item.roomname}</li>
                <li>{item.name}</li>
                </ul>
        ));
        return (listItems);
    }
    if(roomnum !== 0) {
        if(join===0) renderChat();
        return(<Faded>
            <div style={{color:'white'}}>
                {roomnum}번 방입니다.
            </div>
            <div className="room-container">
                <div className="room-canvas"></div>
                <div className="room-chat-box">
                    <ul id="room-chat">
                        <li>안녕하세요</li>
                    </ul>
                    <div>
                        <input id="chat-input" onChange={onChangeChat} type="text" value={chat}/>
                        <button onClick={()=>{sendChat(roomnum,name,chat)}}>입력</button>
                    </div>
                </div>
            </div>
        </Faded>);
    }
    else if(idx === 0){
        return (
            <Faded>
                <div className='reaction-submit-box'>
                    <input onChange={onChangeName} className='reaction-submit-input'></input>
                    <div onClick={()=>{submitName(name)}} className='reaction-submit-button'>입력</div>
                </div>
            </Faded>
        );
    } else {
        return(
            <Faded>
                <div className='sketch-box'>
                    <ul>
                        <li>방 번호</li>
                        <li>방 제목</li>
                        <li>방장 이름</li>
                    </ul>
                    {makeBox()}
                    <button onClick={() => {createRoom(room,name)}}>방 생성</button>
                    <input onChange={onChangeRoom} type="text"></input>
                </div>
            </Faded>
        );
    }
}

export default Sketch;