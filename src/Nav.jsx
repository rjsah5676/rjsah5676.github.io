import React, { Component } from 'react';
import {Link} from 'react-router-dom';

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
               <li><Link to={{pathname:'about'}}><div className='nav-text'>ABOUT</div></Link></li>
               <li>
                    <Link to={{pathname:'project'}}><div className='nav-text'>PROJECT</div></Link>
                    <ul className="test-sub-game">
                        <li><Link to={{pathname:'project'}}>프로젝트</Link></li>
                        <li><Link to={{pathname:'study'}}>개인공부</Link></li>
                    </ul>
                </li>
               <li>
                   <Link className="test-menu" to={{pathname:'melongame'}}><div className='nav-text'>GAMES</div></Link>
                    <ul className="test-sub-game">
                        <li><Link to={{pathname:'melongame'}}>멜론 게임</Link></li>
                        <li><Link to={{pathname:'rspeed'}}>반응속도 테스트</Link></li>
                        <li><Link to={{pathname:'sketch'}}>스케치 퀴즈</Link></li>
                    </ul>
               </li>
               <li>
                    <Link to={{pathname:'guest'}}><div className='nav-text'>GUEST BOX</div></Link>
               </li>
               <li><Link to={{pathname:'gallery'}}><div className='nav-text'>GALLERY</div></Link></li>
               <div id="tesst"></div>
           </ul>
        );
    };
}

export default Nav;