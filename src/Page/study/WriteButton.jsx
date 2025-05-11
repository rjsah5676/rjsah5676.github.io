import { useState } from 'react';
import { useHistory } from 'react-router-dom';

function WriteButton() {
  const [password, setPassword] = useState('');
  const [showInput, setShowInput] = useState(false);
  const history = useHistory();

  const handleAccess = () => {
    if (password === 'rjsah7') {
      history.push('/study/write');
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      {showInput ? (
        <div style={{position:'fixed', bottom:'20px', left:'20px'}}>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          />
          <button onClick={handleAccess}>확인</button>
        </div>
      ) : (
        <button style={{position:'fixed', bottom:'20px', left:'20px', cursor:'pointer'}} onClick={() => setShowInput(true)}>✏️ 글쓰기</button>
      )}
    </div>
  );
}

export default WriteButton;