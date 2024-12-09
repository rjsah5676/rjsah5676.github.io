import React, { Component } from 'react';
import {Link} from 'react-router-dom';
import { Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import './css/nav.css';

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
               <li><Link to={{pathname:'about'}}>소개</Link></li>
               <li><Link to={{pathname:'project'}}>프로젝트</Link></li>
               <li>
                   <Link className="test-menu" to={{pathname:'melongame'}}>게임</Link>
                    <ul className="test-sub-game">
                        <li><Link to={{pathname:'melongame'}}>멜론 게임</Link></li>
                        <li><Link to={{pathname:'/'}}>테슷트</Link></li>
                    </ul>
               </li>
               <li>
                    <Link to={{pathname:'guest'}}>방명록</Link>
               </li>
               <li><Link to={{pathname:'image'}}>사진</Link></li>
               <div id="tesst"></div>
           </ul>
        );
    };
}

export default Nav;