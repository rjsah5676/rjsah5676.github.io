import React, { Component } from 'react';
import gitImg from '../src/img/footer/github.png';

class Footer extends Component {
    render() {
        const st = {
            textDecoration: 'none',
            color: 'white'
        }
        const gitst= {
            width:'50px',
            display:'inline',
            float:'left',
            margin:'10px 0px 0px 10px'
        }
        return(
            <div className="footer">
                <a href="https://github.com/rjsah5676"><img src={gitImg} style={gitst} alt=""/></a>
                Copyright 2021. 이건모. All right Reserved<a style= {st} href="#/ewfwfeff">.</a>
            </div>
        );
    };
}

export default Footer;