"use client";

import { openContactModal } from "../hooks/useDraggableContactModal";

export default function Contact() {
  return (
    <div id="contact-container">
      <div id="contact-box">
        <div id="contact-img-info">
          <div id="contact-img"></div>
        </div>
        <ul>
          <li className="contact-name">Gunmo Lee</li>
          <li className="contact-info" id="contact-tel">
            Tel.&nbsp;&nbsp; 010-6385-4676
          </li>
          <li className="contact-info" id="contact-email">
            Email.&nbsp;&nbsp; rjsah5676@gmail.com
          </li>
        </ul>
        <button id="exit-button" onClick={() => openContactModal(0)}>
          X
        </button>
      </div>
    </div>
  );
}
