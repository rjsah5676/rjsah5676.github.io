import React, { Component } from 'react';
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import './css/nav.css';

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
        
        return(
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
        );
    };
}

export default Nav;