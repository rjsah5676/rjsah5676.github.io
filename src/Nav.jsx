import React, { Component } from 'react';
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import './css/nav.css';

class Nav extends Component {
    render() {
        const buttonStyle = {

          };
        return(
            <ul class="nav-bar">
                <li>
                    <Navbar style={buttonStyle}>
                        <NavLink class="nav-link" to="/">소개</NavLink>
                    </Navbar>
                </li>
                <li>
                    <Navbar style={buttonStyle}>
                        <NavLink class="nav-link" to="/">알고리즘 공부</NavLink>
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