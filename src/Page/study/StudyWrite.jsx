import React, { useState, useEffect } from 'react';
import firebase from '../../firebase';
import { useHistory, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const db = firebase.firestore();

function StudyWrite() {
  const history = useHistory();
  const location = useLocation();

  const isEdit = location.state?.isEdit || false;
  const postData = location.state?.post || null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Java');
  const [content, setContent] = useState('');

  const categories = ['Java', 'Network', 'Database', 'Frontend', 'etc'];

  useEffect(() => {
    if (isEdit && postData) {
      setTitle(postData.title);
      setCategory(postData.category);
      setContent(postData.content);
    }
  }, [isEdit, postData]);

  const submitPost = async () => {
    if (title === '' || content === '') {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;

    try {
      if (isEdit && postData.id) {
        // 수정
        await db.collection('studyPosts').doc(postData.id).update({
          title,
          content,
          category,
          date: formattedDate,
        });
        alert('글이 수정되었습니다!');
      } else {
        // 신규 작성
        await db.collection('studyPosts').add({
          title,
          content,
          category,
          date: formattedDate,
        });
        alert('글이 저장되었습니다!');
      }

      history.push('/study');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류 발생');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ color: 'white' }}>{isEdit ? '✏️ 글 수정' : '✏️ 글쓰기'}</h2>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <ReactQuill
        value={content}
        onChange={setContent}
        placeholder="내용을 입력하세요..."
        style={{ minHeight: '300px', marginBottom: '1rem', background: 'white' }}
        modules={{
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'image'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }}
      />

      <button
        onClick={submitPost}
        style={{
          marginTop: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#4a7b63',
          color: 'white',
          border: 'none'
        }}
      >
        {isEdit ? '수정하기' : '저장하기'}
      </button>
    </div>
  );
}

export default StudyWrite;
