/**
 * NutriTrack - Firebase Auth Module
 * Initializes Firebase, exposes auth helpers used by every page.
 *
 * NOTE: The Firebase API key below is intentionally public — this is by design.
 * Firebase Web API keys are not secrets; they identify your Firebase project and
 * are safe to commit. Security is enforced by Firestore Security Rules on the
 * server side, not by hiding this key. See:
 * https://firebase.google.com/docs/projects/api-keys#api-keys-for-firebase-are-different
 */

// firebase-api-key-public: intentional — not a secret, required in client code
const firebaseConfig = {
  apiKey:            "AIzaSyAQ0uZOVsdG-Csn0bi1J6hhIaIzOsVpUq0",
  authDomain:        "nutritrack-cb4b0.firebaseapp.com",
  projectId:         "nutritrack-cb4b0",
  storageBucket:     "nutritrack-cb4b0.firebasestorage.app",
  messagingSenderId: "372874410575",
  appId:             "1:372874410575:web:05aedccc8c4d734594483a",
  measurementId:     "G-171GK4V7RK",
};

// Guard against double-init (e.g. if script loaded twice)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db   = firebase.firestore();

// Offline persistence so the app works when temporarily without internet
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  // 'failed-precondition': multiple tabs open — only one gets persistence (ok)
  // 'unimplemented': browser doesn't support it
  if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
    console.warn('Firestore persistence error:', err);
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

function getUID() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated — call requireAuth() first');
  return user.uid;
}

// Returns a Firestore CollectionReference scoped to the current user
function userCol(colName) {
  return db.collection('users').doc(getUID()).collection(colName);
}

// ── Auth Guards ────────────────────────────────────────────────────────────

/**
 * Call on protected pages. Resolves with the user object when logged in,
 * or redirects to loginPage if not authenticated.
 */
function requireAuth(loginPage = 'login.html') {
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub(); // only fire once
      if (user) {
        resolve(user);
      } else {
        window.location.href = loginPage;
      }
    });
  });
}

/**
 * Call on login/signup pages. Redirects already-logged-in users to the app.
 */
function requireGuest(dashPage = 'index.html') {
  const unsub = auth.onAuthStateChanged((user) => {
    unsub();
    if (user) window.location.href = dashPage;
  });
}

// ── Auth Operations ────────────────────────────────────────────────────────

async function signUp(email, password, displayName) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await cred.user.updateProfile({ displayName: displayName.trim() });
  }
  return cred.user;
}

async function signIn(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

async function signOut() {
  await auth.signOut();
  window.location.href = 'login.html';
}

async function sendPasswordReset(email) {
  await auth.sendPasswordResetEmail(email);
}

// ── Public API ─────────────────────────────────────────────────────────────

window.FirebaseAuth = {
  auth, db,
  getUID, userCol,
  requireAuth, requireGuest,
  signUp, signIn, signOut, sendPasswordReset,
};
