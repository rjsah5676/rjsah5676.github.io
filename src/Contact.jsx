import React from 'react';

function Contact(){
    function openContact(a){
        let ct=document.getElementById("contact-container");
        ct.style.opacity=a;
        if(a===1) {
            ct.style.zIndex=10;
        }
        if(a===0) {
            ct.style.zIndex=-1;
        }
    }
    return(
        <div id="contact-container">
            <div id="contact-box">
                <div id="contact-img-info">
                    <div id="contact-img"></div>
                </div>
                <ul>
                    <li className="contact-name">
                        Gunmo Lee
                    </li>
                    <li className="contact-info" id="contact-tel">
                        Tel.&nbsp;&nbsp; 010-6385-4676
                    </li>
                    <li className="contact-info" id="contact-email">
                        Email.&nbsp;&nbsp; rjsah5676@gmail.com
                    </li>
                </ul>
            <button id="exit-button" onClick={() => openContact(0)}>X</button>
            </div>
        </div>
    )
}

export default Contact;