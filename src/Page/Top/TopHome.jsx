import React, { Component } from 'react';
import {NavLink} from 'react-router-dom';

class TopHome extends Component {
    componentDidMount() {
        function getNumberFromPixel(_px) {
            if (_px === null || _px === "") {
                return 0;
            }
            
            _px = _px + "";
            
            if (_px.indexOf("px") > -1) {
                _px = _px.replace("px", "");
            }
            
            if (_px.indexOf("PX") > -1) {
                _px = _px.replace("PX", "");
            }
            
            var result = parseInt(_px, 10);
            if ((result + "") === "NaN") {
                return 0;
            }
            
            return result;
        }
    let modal=document.getElementById("contact-container");
    let clicked=0;
    let f_x=0;
    let f_y=0;
    
    let m_x=0;
    let m_y=0;
    
    let c_x=0;
    let c_y=0;
    
    let cnt=0;
    if(modal)
    modal.addEventListener("mousedown", (e) =>{
        if(clicked==0) {
            c_x=getNumberFromPixel(modal.style.left);
            c_y=getNumberFromPixel(modal.style.top);
            modal.style.cursor="grabbing";
            clicked=1;
        }
        setTimeout(function moveModal(){
            modal.style.left=c_x+m_x-f_x+'px';
            modal.style.top=c_y+m_y-f_y+'px';
            c_x=getNumberFromPixel(modal.style.left);
            c_y=getNumberFromPixel(modal.style.top);
            f_x=m_x;
            f_y=m_y;
            setTimeout(moveModal,10);
            cnt++;
        },10);
        window.addEventListener("mouseup", (e) =>{
            cnt=0;
            clicked=0;
            modal.style.cursor="grab";
        });
        window.addEventListener("mousemove",(e)=>{
            if(clicked==1) {
                m_x=e.clientX;
                m_y=e.clientY;
                if(cnt<1000000) {
                    cnt=1000000;
                    f_x=e.clientX;
                    f_y=e.clientY;
                }
            }
        });
    });
    }
    render() {
        function openContact(a){
            let ct=document.getElementById("contact-container");
            ct.style.left=(window.innerWidth-ct.offsetWidth)/2 + 'px';
            ct.style.top=window.innerHeight/4+'px';
            ct.style.opacity=a;
            if(a===1) {
                ct.style.zIndex=10;
            }
            if(a===0) {
                ct.style.zIndex=-1;
            }
        }
        const topStyle = {
            color: '#444444',
            padding: '16px',
            borderWidth: '0px 0px 4px 0px',
            borderStyle: 'solid',
            fontWeight: '800'
        };
        const archiveStyle = {
                color: '#444444',
                padding: '16px',
                borderWidth: '0px 0px 0px 0px',
                borderStyle: 'solid',
                fontWeight: '400',
                textDecoration:'none'
        };
        const topStyle2 = {
            borderBottom: '0px'
        };     
        return(
            <div className="top">  
            <NavLink to="/" style={topStyle2}>
                <div className="top-left">
                    <table>
                        <tbody>
                        <tr>
                            <td><div className="top-left-img"/></td>
                            <td><div className="top-left-title"><b>Gunmo's Dev Life</b></div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </NavLink>
            <div className="top-right">
                <table>
                        <tbody>
                        <tr>
                            <td><div className="top-contact" onClick={() => openContact(1)}>Contact</div></td>
                            <td><div className="top-right-home"> <NavLink className="activ" style={topStyle} to="/">Home</NavLink></div></td>
                            <td><div className="top-right-archives"><NavLink style={archiveStyle} to="/archive">Archive</NavLink></div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
}

export default TopHome;