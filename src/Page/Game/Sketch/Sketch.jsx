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

   useEffect(()=>{
        renderList();
        },[]);
    
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
    function makeBox(){
        const listItems = list.map((item) =>
            (
                <ul>
                <li>{item.num}</li>
                <li style={{cursor:'pointer'}}onClick={()=>{setRoomnum(item.num)}}>{item.roomname}</li>
                <li>{item.name}</li>
                </ul>
        ));
        return (listItems);
    }
    if(roomnum !== 0) {
        return(<Faded>
            <div style={{color:'white'}}>
                {roomnum}번 방입니다.
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