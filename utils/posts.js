// utils/posts.js
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Create a new post
 */
export async function createPost({ authorId, authorType, content, image }) {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      authorId,
      authorType,
      content,
      image: image || null,
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp(),
    });
    console.log(`Post created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
  }
}

/**
 * Fetch posts for the home feed based on following list
 */
export async function getFeedPosts(currentUserId, limitNum = 20) {
  try {
    // 1. Get the current user's following
    const userDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!userDoc.exists()) return [];

    const userData = userDoc.data();
    const followingUsers = userData.following || []; // array of user IDs
    const followingClubs = userData.followingClubs || []; // array of club IDs if you track clubs separately

    // Combine both
    const authorsToFetch = [...followingUsers, ...followingClubs];

    if (authorsToFetch.length === 0) return [];

    // 2. Query posts by authorsToFetch
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorId', 'in', authorsToFetch), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return posts.slice(0, limitNum);
  } catch (error) {
    console.error('Error fetching feed posts:', error);
    return [];
  }
}
