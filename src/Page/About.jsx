import React from "react";
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
              <br/>C:\Gunmo\Skills><b> React Express SpringBoot WebSocket MySQL etc.</b>
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
              <div className="about-desc">
                <p>&nbsp;저는 ‘만드는 일’이 좋아서 개발자가 되었습니다. 어릴 때는 게임 속 캐릭터 이름 바꾸는 것조차 재밌었고,<br/> 어느 순간엔 직접 만드는 쪽이 더 즐겁다는 걸 깨달았습니다.</p>

                <p>&nbsp;대학교에서 소프트웨어를 전공하고, 군 복무 이후 잠시 멀어졌던 개발을 다시 붙잡기 위해 국비 교육에 참여했습니다.<br/>
                다시 코드를 마주하자, 예전보다 더 진지하고 깊이 있게 몰입하는 제 자신을 발견할 수 있었습니다.</p>

                <p>&nbsp;많은 프로젝트 동안 저는 단순히 기능을 구현하는 것을 넘어서,<br/>
                 "왜 이렇게 구성해야 할까?", "사용자는 어디서 불편함을 느낄까?"를 끊임없이 고민하며 프로젝트를 완성했습니다.<br/>
                 팀장을 맡아 팀원들의 다양한 의견을 조율하고, 실시간 경매 기능, 채팅 시스템, 정산 구조, 통계 페이지 등 복잡한 기능을 설계하고 구현하며,<br/>
                  진짜 서비스처럼 움직이는 웹 애플리케이션을 만들어냈습니다.</p>

                <p>&nbsp;특히 WebSocket, JWT, REST API, MySQL, React-Redux 등 여러 기술을 연동하며<br/>
                 전체 흐름을 연결해보는 경험은 개발자로서의 시야를 넓히는 계기가 되었습니다.<br/>
                  기술 자체보다 중요한 건 "문제를 끝까지 해결하는 태도"라는 걸 몸으로 배웠습니다.</p>

                <p>&nbsp;혼자서도 꾸준히 사이드 프로젝트를 진행했고, 반응형 UI/UX 개선, 무한 스크롤,<br/>
                 파일 업로드, 실시간 알림 등 다양한 사용자 경험을 고민하며 끊임없이 기능을 다듬어왔습니다.<br/>
                '보기 좋은 것이 쓰기도 좋다'는 철학으로, 디자인과 코드의 균형을 맞추려 항상 노력하고 있습니다.</p>

                <p>&nbsp;제 개발 인생은 아직 1.0 버전이지만, 스스로 업데이트를 멈추지 않고 계속해서 나아가고 있습니다.<br/>
                 ‘감사한 마음으로 즐겁게 일하자’는 저만의 원칙을 지키며, 언젠가 더 많은 사람들에게 도움이 되는 서비스를 만드는 것이 제 꿈입니다.</p>
              </div>
               <div className="about-qa">
                <p><b>&nbsp;🙋‍♂️ 자주 듣는 질문들</b></p>
                <p>&nbsp;Q. 혼자 일하는 거 좋아하세요?<br/>
                &nbsp;A. 혼자 시작해서 함께 마무리하는 걸 좋아합니다.</p>

                <p>&nbsp;Q. 가장 기억에 남는 버그는?<br/>
                &nbsp;A. 새벽에 서버 공격받고 DB날아가서 아침에 콘솔 붙잡고 있었던 그날이요... 😅</p>

                <p>&nbsp;Q. 개발하면서 가장 뿌듯했던 순간?<br/>
                &nbsp;A. 팀원들이 만든 UI 보고 '와 이거 진짜 서비스 같아졌다'고 했을 때요.</p>

                <p>&nbsp;Q. 앞으로 어떤 개발자가 되고 싶으세요?<br/>
                &nbsp;A. 실력도 중요하지만, 결국 믿고 함께할 수 있는 개발자가 되고 싶어요.</p>
              </div>

              <div className="about-ending">
                <p>&nbsp;<i>"혼자 잘하는 사람보다, 같이 잘할 수 있는 사람이 되겠습니다."</i></p>
              </div>
            </div>
        </div>
      </Faded>
    );
}

export default About;
