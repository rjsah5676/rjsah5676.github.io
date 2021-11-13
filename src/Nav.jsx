import React, { Component } from 'react';
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import './css/nav.css';
import $ from "jquery";

class Nav extends Component {
    render() {
        function goToInfo(){
            window.location.href='#/info';
        }
        function goToAlgo(){
            window.location.href='#/algorithm';
        }
        function goToaa(){
            window.location.href='#/melongame';
        }
        function goTobb(){
            window.location.href='#/bb';
        }
        function goTocc(){
            window.location.href='#/cc';
        }
        const buttonStyle = {

        };
        const subStyle = {
            listStyleType: 'none'
        };
        return(
            /*
            <ul className="nav-bar">
                <li onClick={goToInfo}>
                    <Navbar>
                        <NavLink className="nav-link" to="/info">소개</NavLink>
                    </Navbar>
                </li>
                <li onClick={goToAlgo}>
                    <Navbar style={buttonStyle}>
                        <NavLink className="nav-link" to="/algorithm">알고리즘 공부</NavLink>
                    </Navbar>
                </li>
                <li onClick={goToaa}>
                    <Navbar style={buttonStyle}>
                        <NavLink className="nav-link" to="/melongame">멜론 게임</NavLink>
                    </Navbar>
                    <div className="sub-menu">
                        <Navbar style={buttonStyle}>
                            <NavLink className="sub-link" to="/melongame">멜론 게임</NavLink>
                        </Navbar>
                    </div>
                </li>
                <li onClick={goTobb}>
                    <Navbar style={buttonStyle}>
                        <NavLink className="nav-link" to="/bb">생각중</NavLink>
                    </Navbar>
                </li>
                <li onClick={goTocc}>
                    <Navbar style={buttonStyle}>
                        <NavLink className="nav-link" to="/cc">사진</NavLink>
                    </Navbar>
                </li>
            </ul>
            */
           <ul id="test-nav">
               <li><a href="#/info">소개</a></li>
               <li><a href="#/algorithm">알고리즘 공부</a></li>
               <li>
                   <a className="test-menu" href="#/melongame">게임</a>
                    <ul className="test-sub">
                        <li><a href="#/melongame">멜론 게임</a></li>
                        <li><a href="#">테슷트</a></li>
                    </ul>
               </li>
               <li><a href="#/info">생각중</a></li>
               <li><a href="#/algorithm">사진</a></li>
               <div id="tesst"></div>
           </ul>
        );
    };
}

export default Nav;