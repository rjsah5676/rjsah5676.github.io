import React, { Component } from 'react';
import {NavLink} from 'react-router-dom';
class TopNone extends Component {
    render() {
        function openContact(a){
            let ct=document.getElementById("contact-container");
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
            borderWidth: '0px 0px 0px 0px',
            borderStyle: 'solid',
            fontWeight: '400'
        };
        const archiveStyle = {
                color: '#444444',
                padding: '16px',
                borderWidth: '0px 0px 0px 0px',
                borderStyle: 'solid',
                fontWeight: '400',
                textDecoration:'none'
        };

        return(
            <div className="top">  
            <NavLink to="/" style={topStyle}>
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
                            <td><div className="top-right-home"> <NavLink style={topStyle} to="/">Home</NavLink></div></td>
                            <td><div className="top-right-archives"><NavLink style={archiveStyle} to="/archive">Archive</NavLink></div></td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
}

export default TopNone;