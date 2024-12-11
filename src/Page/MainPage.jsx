import React, { Component } from "react";
import '../css/Page/mainPage.css'
import FadeIn from "../effect/FadeIn";
class MainPage extends Component {  
  render (){
    return (
      <FadeIn>
        <div className="main_page">
          <div className="main-title"><h1>ABOUT ME</h1></div>
          <div className="main_box">          
              <div className="main_page-left">
                <div className="main_page-left-img"/>
              </div>
              <div className="main_page-right">
                <ul>
                  <li>
                    <h2>&nbsp;PROFILE</h2>
                    <ul>
                      <table>
                        <tr>
                          <td className="td_left">거주지</td>
                          <td>&nbsp;경기도 성남시</td>
                        </tr>
                        <tr>
                          <td className="td_left">생년월일</td>
                          <td>&nbsp;1997. 12. 10</td>
                        </tr>
                        <tr>
                          <td className="td_left">이메일</td>
                          <td>&nbsp;rjsah5676@gmail.com</td>
                        </tr>
                      </table>
                    </ul>
                  </li>
                  <li>
                  <h2>&nbsp;HISTORY</h2>
                    <ul>
                      <table>
                        <tr>
                          <td className="td_left">2013.03 ~ 2016.02</td>
                          <td>&nbsp;풍생고등학교 졸업</td>
                        </tr>
                        <tr>
                          <td className="td_left">2016.03 ~ 2022.02</td>
                          <td>&nbsp;아주대학교 소프트웨어학과 졸업</td>
                        </tr>
                        <tr>
                          <td className="td_left">2017.03 ~ 2018.12</td>
                          <td>&nbsp;5사단 근무 및 군휴학</td>
                        </tr>
                      </table>
                    </ul>
                  </li>
                  <li>
                    <h2>&nbsp;TECH</h2>
                    <ul>
                    <table>
                      <th>구분</th>
                      <th>범위</th>
                      <tr>
                        <td className="td_left">Frontend</td>
                        <td>&nbsp;React, JSP, JS</td>
                      </tr>
                      <tr>
                        <td className="td_left">Backend</td>
                        <td>&nbsp;NodeJS(Express), Java(Spring), Python(Flask)</td>
                      </tr>
                      <tr>
                        <td className="td_left">DataBase</td>
                        <td>&nbsp;MongoDB, MySQL</td>
                      </tr>
                    </table>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>     
        </div>
      </FadeIn>
    );
  }
}

export default MainPage;
