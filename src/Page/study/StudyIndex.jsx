import React, { useState, useEffect } from 'react';
import firebase from '../../firebase';
import WriteButton from './WriteButton';
import '../../css/Page/study.css';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import { useHistory } from 'react-router-dom';

const db = firebase.firestore();
const categories = ['Java', 'Network', 'Database', 'Frontend', 'etc'];

function StudyIndex() {
  const history = useHistory();

  const [selectedCategory, setSelectedCategory] = useState('Java');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // ✅ 햄버거 메뉴 상태

  useEffect(() => {
    const fetchPosts = async () => {
      const snapshot = await db
        .collection('studyPosts')
        .where('category', '==', selectedCategory)
        .get();

      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title
      }));

      setPosts(newPosts);
      setSelectedPost(null);
    };

    fetchPosts();
  }, [selectedCategory]);

  const handleClickPost = async (id) => {
    const doc = await db.collection('studyPosts').doc(id).get();
    if (doc.exists) {
      setSelectedPost({ id: doc.id, ...doc.data() });
      setIsMenuOpen(false); // ✅ 모바일에서 메뉴 닫기
    } else {
      alert('해당 글을 찾을 수 없습니다.');
    }
  };

  return (
    <div className="study-container" style={{ display: 'flex', minHeight: '80vh' }}>
      {/* ✅ 햄버거 버튼 */}
      <button
        className="hamburger-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        📄
      </button>

      {/* ✅ 사이드 메뉴 */}
      <nav className={isMenuOpen ? 'open' : ''}>
        <h3 style={{ color: 'white' }}>📚 분류</h3>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {categories.map((cat) => (
            <li key={cat} style={{ marginBottom: '1rem' }}>
              <div
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsMenuOpen(false); // ✅ 모바일 닫기
                }}
                style={{
                  cursor: 'pointer',
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  color: selectedCategory === cat ? '#4a7b63' : '#ccc',
                }}
              >
                ▸ {cat}
              </div>

              {selectedCategory === cat && (
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  {posts.map((post) => (
                    <li
                      key={post.id}
                      style={{
                        color: selectedPost?.id === post.id ? '#fff' : '#aaa',
                        fontWeight: selectedPost?.id === post.id ? 'bold' : 'normal',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleClickPost(post.id)}
                    >
                      - {post.title}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* ✅ 본문 */}
      <section style={{ flex: 1, padding: '1rem', color: 'white' }}>
        {selectedPost ? (
          <div>
            <h2>{selectedPost.title}</h2>
            <div
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              style={{
                marginTop: '1rem',
                wordBreak: 'break-word'
              }}
              className="quill-content"
            />
            <div style={{ marginTop: '1rem' }}>
              <EditButton post={selectedPost} />
              <DeleteButton
                postId={selectedPost.id}
                onDeleteSuccess={() => {
                  setSelectedPost(null);
                }}
              />
            </div>
          </div>
        ) : (
          <>
            <h2>{selectedCategory}</h2>
            <p>🔧 {selectedCategory} 관련 글들을 왼쪽에서 선택하세요.</p>
          </>
        )}
      </section>

      <WriteButton />
    </div>
  );
}

export default StudyIndex;
