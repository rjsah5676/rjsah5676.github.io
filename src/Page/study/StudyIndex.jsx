import React, { useState, useEffect } from 'react';
import firebase from '../../firebase';
import WriteButton from './WriteButton';
import '../../css/Page/study.css';
import DeleteButton from './DeleteButton';
const db = firebase.firestore();
const categories = ['Java', 'Network', 'Database', 'Frontend', 'etc'];

function StudyIndex() {
  const [selectedCategory, setSelectedCategory] = useState('Java');
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

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
    } else {
      alert('해당 글을 찾을 수 없습니다.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh' }}>
      <nav style={{ width: '250px', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <h3 style={{ color: 'white' }}>📚 분류</h3>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {categories.map((cat) => (
            <li key={cat} style={{ marginBottom: '1rem' }}>
              <div
                onClick={() => setSelectedCategory(cat)}
                style={{
                  cursor: 'pointer',
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  color: selectedCategory === cat ? '#4a7b63' : '#ccc'
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
                        color: '#aaa',
                        fontSize: '0.9rem',
                        marginBottom: '0.3rem',
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
            <DeleteButton
            postId={selectedPost.id}
            onDeleteSuccess={() => {
                setSelectedPost(null);
            }}
            />
          </div>
        ) : (
          <>
            <h2>{selectedCategory}</h2>
            <p>🔧 {selectedCategory} 관련 글들을 왼쪽에서 선택하세요.</p>
          </>
        )}
      </section>
      <WriteButton/>
    </div>
  );
}

export default StudyIndex;
