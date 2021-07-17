import React, { Component} from "react";
import '../css/Page/mainPage.css'

class MainPage extends Component {
  render (){
    return (
      <div class="main_page">
        <div class="main-title"><h1>ABOUT ME</h1></div>
        <div class="main_box">          
            <div class="main_page-left">
              <div class="main_page-left-img"/>
            </div>
            <div class="main_page-right">
              <ul>
                <li>
                  프로필
                  <ul>
                    <table>
                      <tr>
                        <td>거주지</td>
                        <td>경기도 성남시</td>
                      </tr>
                      <tr>
                        <td>생년월일</td>
                        <td>1997. 12. 10</td>
                      </tr>
                      <tr>
                        <td>이메일</td>
                        <td>rjsah5676@gmail.com</td>
                      </tr>
                    </table>
                  </ul>
                </li>
                <li>
                  history
                  <ul>
                    <table>
                      <tr>
                        <td>2013.03 ~ 2016.02</td>
                        <td>풍생고등학교 졸업</td>
                      </tr>
                      <tr>
                        <td>2016.03 ~ 2021.07</td>
                        <td>아주대학교 소프트웨어학과 4학년 재학중</td>
                      </tr>
                      <tr>
                        <td>2017.03 ~ 2018.12</td>
                        <td>5사단 근무 및 군휴학</td>
                      </tr>
                    </table>
                  </ul>
                </li>
                <li>
                  기술
                  <ul>
                  <table>
                    <th>구분</th>
                    <th>범위</th>
                    <tr>
                      <td>Frontend</td>
                      <td>React, JSP, JS</td>
                    </tr>
                    <tr>
                      <td>Backend</td>
                      <td>NodeJS(Express), Java(Spring), Python(Flask)</td>
                    </tr>
                    <tr>
                      <td>DataBase</td>
                      <td>MongoDB, MySQL</td>
                    </tr>
                  </table>
                  </ul>
                </li>
              </ul>
            </div>
          </div>     
      </div>
    );
  }
}

export default MainPage;
