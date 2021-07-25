import React, { Component} from "react";
import Faded from "../effect/Faded";
import '../css/Page/info.css';
import infoCalendar from '../img/Page/info/info_calendar.png';

class InfoBox extends Component {
  render (){
    const boxStyle = {
        width:"70%",
        height: "700px",
//        backgroundColor: "red",
        margin: "auto",
        borderBottom: "1px grey dotted",
        padding: '20px 0px 20px 0px',
    };
    const imgStyle = {
    }
    const yearStyle = {
      fontSize:'35px',
      width:'330px',
    };
    const titleStyle = {
      fontSize: '30px',
      fontWeight: '800',
      borderLeft: '5px black solid',
      display: 'inline',
      marginLeft: '5px'
    }
    const postStyle = {
      fontSize:'20px',
      display:'inline-block',
      marginLeft:'5px',
      fontWeight: '500'
    }
    return (
        <div className="info-box" style={boxStyle}>
          <div className="info-year" style={yearStyle}>
            <img src={infoCalendar} style={{width:'30px', marginTop:'10px'}}></img>&nbsp;{this.props.date}
          </div>
          <div className="info-img" style={imgStyle}></div>
          <div className='info-title' style={titleStyle}>&nbsp;{this.props.title}</div>
          <div className="post-box"><pre style={postStyle}>{this.props.post}</pre></div>
        </div>
    );
  }
}

class MyInfo extends Component {
  render (){
    var post1 = "안녕하세요\n건모입니다";
    return (
      <Faded>
        <div className="info-wrap">
          <InfoBox page="1" date="2011.01~2011.04" title="처음글 타이틀입니다" post={post1}></InfoBox>
          <InfoBox page="2" date="2013.11~2021.06" title="오규석입니다" post={post1}></InfoBox>
          <InfoBox page="3" date="2016.11~2018.06" title="안녕하세요" post={post1}></InfoBox>
          <div style={{height:'50px'}}></div>
        </div>
      </Faded>
    );
  }
}

export default MyInfo;
