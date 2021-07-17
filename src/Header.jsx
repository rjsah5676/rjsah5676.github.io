import React, { Component } from 'react';
import './css/header.css';

class Header extends Component {
    render() { 
        return(
            <div class="header">
                <b><a class="header-title" href="/">Gunmo's Develop Life</a></b>
            </div>
        );
    };
}

export default Header;