import React, { Component } from 'react';
import './css/footer.css';

class Footer extends Component {
    render() {
        const st = {
            textDecoration: 'none',
            color: 'white'
        }
        return(
            <div class="footer">
                Copyright 2021. 이건모. All right Reserved<a style= {st} href="#/ewfwfeff">.</a>
            </div>
        );
    };
}

export default Footer;