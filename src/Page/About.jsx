import React, { Component} from "react";
import Faded from "../effect/Faded";

function About() {
    return (
      <Faded>
        <div className="about-wrap">
            <div className='about-container'>
              <div className="about-title">About</div>
              <div className='about-info'>&nbsp;안녕하세요🖐<br/>&nbsp;풀스택 개발자를 목표하는 <b style={{color:'white'}}>이건모</b> 입니다.🙂</div>
              <div className='about-who'>&nbsp;WHO AM I ?</div>
              <div className='about-cmd'><div className='about-cmd-detail'>Gunmo's Dev Life [Version 1.0.0]<br/>(c) Gunmo's Dev Life Corporation. All rights reserved
              <br/>
              <br/>C:\Gunmo\Name><b> Lee Gunmo</b>
              <br/>C:\Gunmo\BirthDay><b> 1997.12.10</b>
              <br/>C:\Gunmo\Education><b> Ajou Univ. Software department Bachelor's degree</b>
              <br/>C:\Gunmo\MBTI><b> ISTP</b>
              <br/>C:\Gunmo\Skills><b> React NodeJS Spring MySQL etc.</b>
              <br/>C:\Gunmo\Job><b> be looking for a job . . .</b>
              <br/>C:\Gunmo\Motto><b> Seize the day.</b>
              <br/>C:\Gunmo> shutdown -s
              <br/>
             <pre> 　 ∧  ∧<br/>
              　 (- O  -) <br/>
              ┏━〇〇━━━━━━━━┓<br/>
              ┃    Thank You . . .　 ┃<br/>
              ┃ 　                   ┃<br/>
              ┗┳┳━━━━━━━┳┳┛<br/>
              　┗┛　　　　　　　┗┛<br/></pre>

              </div>
              </div>
              <div className="about-who">&nbsp;좀 더 써내려갈 예정...</div>
            </div>
        </div>
      </Faded>
    );
}

export default About;
