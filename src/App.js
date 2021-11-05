import React, { useRef, useState } from 'react';
import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { useCollectionData } from 'react-firebase-hooks/firestore';
import Linkify from 'react-linkify';

firebase.initializeApp({
  apiKey: "AIzaSyDLSRJnI8JYHIXnFmMr0qg1y38N3urM3-Q",
  authDomain: "foggy-2c749.firebaseapp.com",
  projectId: "foggy-2c749",
  storageBucket: "foggy-2c749.appspot.com",
  messagingSenderId: "669406465856",
  appId: "1:669406465856:web:e9ec501f91ee5690ebb4a5",
  measurementId: "G-X11JE04T1K"
})

const firestore = firebase.firestore();


function App() {

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
  const query = messagesRef.orderBy('createdAt').limitToLast(10);

  const [messages] = useCollectionData(query, { idField: 'id' });

  const [formValue, setFormValue] = useState('');


  const sendMessage = async (e) => {
    e.preventDefault();

    const text = formValue;
    setFormValue('');

    await messagesRef.add({
      text: text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })

    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (<>
    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <span ref={dummy}></span>
    </main>

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Bạn đang nghĩ..." />
      <button type="submit" disabled={!formValue}>Gửi</button>
    </form>
  </>)
}


function ChatMessage(props) {
  const { text } = props.message;

  const messageClass = 'received';

  return (<>
    <div className={`message ${messageClass}`}>
      <Linkify properties={{target: '_blank', style: {color: 'red', fontWeight: 'bold'}}}>
        <p>{text}</p>
      </Linkify>
  </div>
</>)
}


export default App;
