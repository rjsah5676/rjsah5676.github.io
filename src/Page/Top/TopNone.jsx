import React, { Component } from 'react';
import '../../css/top.css';
import {NavLink} from 'react-router-dom';
class TopNone extends Component {
    render() {
        const topStyle = {
            color: 'black',
            padding: '16px',
            borderBottom: '0px'
        };        
        return(
            <div className="top">  
            <NavLink to="/" style={topStyle}>
                <div className="top-left">
                    <table>
                        <tr>
                            <td><div className="top-left-img"/></td>
                            <td><div className="top-left-title"><b>Gunmo's Dev Life</b></div></td>
                        </tr>
                    </table>
                </div>
            </NavLink>
            <div className="top-right">
                <table>
                        <tr>
                            <td><div className="top-right-home"> <NavLink style={topStyle} to="/">Home</NavLink></div></td>
                            <td><div className="top-right-archives">Archives</div></td>
                        </tr>
                    </table>
                </div>
            </div>
        );
    };
}

export default TopNone;