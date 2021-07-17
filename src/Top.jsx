import React, { Component } from 'react';
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import './css/top.css';

class Top extends Component {
    render() {
        const buttonStyle = {

          };
        return(
            <div class="top">  
            <a href="/">
                <div class="top-left">
                    <table>
                        <tr>
                            <td><div class="top-left-img"/></td>
                            <td><div class="top-left-title"><b>Gunmo's Dev Life</b></div></td>
                        </tr>
                    </table>
                </div>
            </a>
            <div class="top-right">
                <table>
                        <tr>
                            <td><div class="top-right-home"><a href="/">Home</a></div></td>
                            <td><div class="top-right-archives">Archives</div></td>
                        </tr>
                    </table>
                </div>
            </div>
        );
    };
}

export default Top;