import React, { useRef, useState } from 'react';
import './App.css';

import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/analytics';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyCiayL5gckfiPlySqBruNIEXMF0EqobJB0",
  authDomain: "chitchat-e2594.firebaseapp.com",
  projectId: "chitchat-e2594",
  storageBucket: "chitchat-e2594.appspot.com",
  messagingSenderId: "209982560306",
  appId: "1:209982560306:web:c4a239a1c7ba06ada9042b",
  measurementId: "G-42DPLRRXWL"
})

const auth = firebase.auth();
const firestore = firebase.firestore();


function App() {

  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>^(@_^)^</h1>
      </header>

      <section>
        <ChatRoom />
      </section>

    </div>
  );
}

function ChatRoom() {
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limitToLast(25);

  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');


  const sendMessage = async (e) => {
    e.preventDefault();

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
    e.focus();
  }

  return (<>
    <main>

      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}

      <span ref={dummy}></span>

    </main>

    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Bạn đang nghĩ..." />

      <button type="submit" disabled={!formValue}>Gửi </button>

    </form>
  </>)
}


function ChatMessage(props) {
  const { text } = props.message;

  const messageClass = 'received';

  return (<>
    <div className={`message ${messageClass}`}>
      <p>{text}</p>
    </div>
  </>)
}


export default App;
