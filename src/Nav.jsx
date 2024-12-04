import React, { Component } from 'react';
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import './css/nav.css';
import $ from "jquery";

class Nav extends Component {
    render() {
        function navGo() {
            document.addEventListener('scroll', onScroll, {passive: true});
            function onScroll() {
                const scrollpos = window.pageYOffset;
                const nav = document.getElementById('test-nav');
                const header = document.querySelector('.header');
                if(373 <= scrollpos) {
                    nav.style.position = "fixed";
                    nav.style.top = '47px';
                    nav.style.opacity = 0.8;
                    header.style.marginBottom = '53px';
                }
                else {
                    nav.style.position = "relative";
                    nav.style.top = 0;
                    nav.style.opacity = 1;
                    header.style.marginBottom = '0px';
                }
            }
        }
        navGo();
        return(
           <ul id="test-nav">
               <li><a href="#/algorithm">소개</a></li>
               <li><a href="#/info">프로젝트</a></li>
               <li>
                   <a className="test-menu" href="#/melongame">게임</a>
                    <ul className="test-sub-game">
                        <li><a href="#/melongame">멜론 게임</a></li>
                        <li><a href="#">테슷트</a></li>
                    </ul>
               </li>
               <li>
                    <a href="#/algorithm">생각중</a>
                    <ul className="test-sub-plus">
                        <li><a href="#">테슷트</a></li>
                        <li><a href="#">테슷트</a></li>
                    </ul>
               </li>
               <li><a href="#/algorithm">사진</a></li>
               <div id="tesst"></div>
           </ul>
        );
    };
}

export default Nav;