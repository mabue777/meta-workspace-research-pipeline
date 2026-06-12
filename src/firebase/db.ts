import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, query, where, getDoc, orderBy } from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './error';

function requireAuth() {
  if (!auth.currentUser) throw new Error("Must be logged in");
  return auth.currentUser.uid;
}

export async function createProject(title: string, description: string) {
  const uid = requireAuth();
  const id = crypto.randomUUID();
  try {
    await setDoc(doc(db, 'projects', id), {
      userId: uid,
      title,
      description,
      createdAt: Date.now()
    });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `projects/${id}`);
  }
}

export async function getProjects() {
  const uid = requireAuth();
  try {
    const res = await getDocs(query(collection(db, 'projects'), where('userId', '==', uid)));
    return res.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'projects');
    return [];
  }
}

export async function createDocument(projectId: string, title: string, content: string, sourceUrl?: string) {
  const uid = requireAuth();
  const id = crypto.randomUUID();
  try {
    const payload: any = {
      projectId,
      userId: uid,
      title,
      content,
      createdAt: Date.now()
    };
    if (sourceUrl) payload.sourceUrl = sourceUrl;
    
    await setDoc(doc(db, 'documents', id), payload);
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `documents/${id}`);
  }
}

export async function getDocuments(projectId: string) {
  const uid = requireAuth();
  try {
    const res = await getDocs(query(collection(db, 'documents'), where('userId', '==', uid)));
    return res.docs.map(d => ({ id: d.id, ...d.data() })).filter((d: any) => d.projectId === projectId);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'documents');
    return [];
  }
}

export async function createVideoAnalysis(projectId: string, videoUrl: string, summary: string, tags: string[]) {
  const uid = requireAuth();
  const id = crypto.randomUUID();
  try {
    await setDoc(doc(db, 'videoAnalysis', id), {
      projectId,
      userId: uid,
      videoUrl,
      summary,
      tags,
      createdAt: Date.now()
    });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `videoAnalysis/${id}`);
  }
}

export async function getVideoAnalyses(projectId: string) {
  const uid = requireAuth();
  try {
    const res = await getDocs(query(collection(db, 'videoAnalysis'), where('userId', '==', uid)));
    return res.docs.map(d => ({ id: d.id, ...d.data() })).filter((d: any) => d.projectId === projectId);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'videoAnalysis');
    return [];
  }
}
