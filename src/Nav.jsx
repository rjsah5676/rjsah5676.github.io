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
        const buttonStyle = {

        };
        
        return(
            <ul class="nav-bar">
                <li onClick={goToInfo}>
                    <Navbar>
                        <NavLink class="nav-link" to="/info">소개</NavLink>
                    </Navbar>
                </li>
                <li onClick={goToAlgo}>
                    <Navbar style={buttonStyle}>
                        <NavLink class="nav-link" to="/algorithm">알고리즘 공부</NavLink>
                    </Navbar>
                </li>
                <li>
                    <Navbar style={buttonStyle}>
                        <NavLink class="nav-link" to="/">생각중</NavLink>
                    </Navbar>
                </li>
                <li>
                    <Navbar style={buttonStyle}>
                        <NavLink class="nav-link" to="/">생각중</NavLink>
                    </Navbar>
                </li>
                <li>
                    <Navbar style={buttonStyle}>
                        <NavLink class="nav-link" to="/">사진</NavLink>
                    </Navbar>
                </li>
            </ul>
        );
    };
}

export default Nav;