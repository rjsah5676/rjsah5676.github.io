import React,{useState, useEffect} from 'react';
import Faded from "../../effect/Faded";
import firebase from "../../firebase";

const db = firebase.firestore();
var tenth_rank = 0;
var ct = 0;
function RspeedGame()
{
    const NUM=5;
    const [start, setStart] = useState(0);
    const [count, setCount] = useState(1);
    const [color, setColor] = useState(0); //0 : red, 1 : green
    const [startTime, setStartTime] = useState(0);
    const [rTime, setRTime] = useState(0);
    const [res, setRes] = useState([]);
    const [list, setList] = useState([]);
    const [ren, setRen] = useState(0);

    const [end, setEnd] = useState(0);
    const [name, setName] = useState('');

    useEffect(async()=>{
        await db.collection("reaction").orderBy("score",'asc').limit(10).get()
            .then(async (querySnapshot) => {
              await querySnapshot.forEach((doc) => {
                  list.push({name:doc.data().name, score:doc.data().score});
                  ct++;
              });
            });
            setRen(1);
        },[]);

    const buttonRedStyle = {
        backgroundColor:'red',
        width:'300px',
        height:'300px',
        borderRadius:'150px',
        margin:'auto',
        marginTop:'60px',
        cursor:'pointer',
    }
    const buttonBlueStyle = {
        backgroundColor:'blue',
        width:'300px',
        height:'300px',
        borderRadius:'150px',
        margin:'auto',
        marginTop:'60px',
        cursor:'pointer',
    }
    function clickStart() {
        setStart(1);
        changeColor(getRandom()*10000);
    }
    const changeColor = (time) => {
        setTimeout(()=>  startTimer(), time);
    };
    const getRandom = () => Math.random()/5+0.3;

    function startTimer() {
        setStartTime(new Date());
        setColor(1);
    }
    function clickRed(){
        window.alert("파란색일때 클릭바랍니다.");
        window.location.reload();
    }
    function clickBlue() {
        let x=new Date().getTime()-startTime.getTime();
        setRes([...res,x]);
        setRTime(x);
        setCount(count+1);
        setColor(0);
        clickStart();
    }
    const onChangeName = (event) => {
        setName(event.target.value);
    };
    function endGame() {
        let score = (res[0]+res[1]+res[2]+res[3]+res[4])/5;
        const output = (<div>
                         <div className='reaction-submit-alert'>{score}점으로 10위안에 랭크되셨습니다. 이름을 입력해주세요.</div>
                         <div className='reaction-submit-box'>
                             <input onChange={onChangeName} className='reaction-submit-input'></input>
                             <div onClick={(e)=>{submitScore(score)}}className='reaction-submit-button'>제출</div>
                         </div>
                     </div>);
        if(score<list[ct-1].score) return output;
        return (output);
            /*
            var userName = window.prompt(dd+"점으로 10위안에 랭크되셨습니다. 이름을 입력해주세요.");
            if(userName !== null) {
              while(userName >= 10 || userName < 1) {
                userName = window.prompt("1글자 이상 9글자 이하로 이름을 입력해주세요.");
              }
              db.collection("reaction").add({name:userName, score: dd});*/
    }
    var x=0;
    async function submitScore(sc) {
        if(name !== ""&& name.length<20 && x===0) {
            x=1;
            await db.collection("reaction").add({name:name, score: sc});
            window.location.reload();
        }
    };
    function makeBox(){
        var ct=1;
        const listItems = list.map((item) =>
            (
            <div style={{color:'white', marginLeft:'20px',fontSize:'20px'}}>{ct++}위: {item.name} / {item.score}ms</div>
        ));
        return (listItems);
    }
        if(start===0) {
            return(
                <Faded>
                    <div className='rspeed-container'>
                       <div style={{position:'absolute', marginTop:'20px'}}> {makeBox()} </div>
                        <p>반응속도 테스트</p>
                        <div onClick={clickStart} className='rspeed-start-button'>시작</div>
                    </div>
                </Faded>
            );
        }
        else if(count === 6) {
            return (
                <Faded>
                    <div className='rspeed-container'>
                        <p>반응속도 테스트</p>
                        <div style={{color:'white', textAlign:'center', marginTop:'20px',fontSize:'30px'}}>결과</div>
                        <div style={{color:'white', textAlign:'center', marginTop:'20px',fontSize:'30px'}}>{(res[0]+res[1]+res[2]+res[3]+res[4])/5} ms</div>
                        {endGame()}
                    </div>
                </Faded>
            );

        }
        else{
            return(
                <Faded>
                    <div className='rspeed-container'>
                        <p>반응속도 테스트</p>
                        <div style={{color:'white', textAlign:'center'}}>버튼이 파란색이 되고 클릭하면 됩니다. 총 {NUM}번 실행됩니다.</div>
                        <div style={{color:'white', textAlign:'center', marginTop:'20px',fontSize:'30px'}}>{count}</div>
                        <div style={{color:'white', textAlign:'center', marginTop:'20px',fontSize:'30px'}}>{rTime} ms</div>
                        <div onClick = { color===0 ? clickRed:clickBlue} style={ color===0 ? buttonRedStyle:buttonBlueStyle}/>
                    </div>
                </Faded>
        )
    }
}

export default RspeedGame;