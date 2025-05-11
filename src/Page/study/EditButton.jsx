import { useState } from 'react';
import { useHistory } from 'react-router-dom';

function EditButton({ post }) {
  const [password, setPassword] = useState('');
  const [showInput, setShowInput] = useState(false);
  const history = useHistory();

  const handleEdit = () => {
    if (password !== 'rjsah7') {
      alert('비밀번호가 틀렸습니다.');
      return;
    }

    history.push('/study/write', {
      isEdit: true,
      post: {
        id: post.id,
        title: post.title,
        category: post.category,
        content: post.content
      }
    });
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {showInput ? (
        <div>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          />
          <button type="button" onClick={handleEdit}>수정</button>
        </div>
      ) : (
        <button
          type="button" 
          style={{
            backgroundColor: '#4a7b63',
            color: 'white',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
          onClick={() => setShowInput(true)}
        >
          ✏️ 글수정
        </button>
      )}
    </div>
  );
}

export default EditButton;