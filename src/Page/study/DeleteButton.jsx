import { useState } from 'react';
import { deleteStudyPost } from '../../firestore/studyPosts';

function DeleteButton({ postId, onDeleteSuccess }) {
  const [password, setPassword] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleDelete = async () => {
    if (password !== 'rjsah7') {
      alert('비밀번호가 틀렸습니다.');
      return;
    }
    console.log('삭제 대상 postId:', postId); 
    try {
      await deleteStudyPost(postId);
      alert('삭제 완료');
      onDeleteSuccess();
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      {showInput ? (
        <div>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          />
          <button onClick={handleDelete}>삭제</button>
        </div>
      ) : (
        <button
          style={{
            backgroundColor: 'red',
            color: 'white',
            cursor: 'pointer'
          }}
          onClick={() => setShowInput(true)}
        >
          🗑 글삭제
        </button>
      )}
    </div>
  );
}

export default DeleteButton;
