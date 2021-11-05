import React, { useRef, useState } from 'react';
import './App.css';

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

import { useCollectionData } from 'react-firebase-hooks/firestore';
import Linkify from 'react-linkify';
import camera from './camera.png';

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
const storage = firebase.storage();


function App() {

  return (
    <div className="App">
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
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })

    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  const handleImageAsFile = (e) => {
    e.preventDefault();

    const file = e.target.files[0]
    const ref = storage.ref(`/images/${file.name}`);
    const uploadTask = ref.put(file);
    uploadTask.on("state_changed", console.log, console.error, () => {
      ref
        .getDownloadURL()
        .then((url) => {
          messagesRef.add({
            image_url: url,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          })

          dummy.current.scrollIntoView({ behavior: 'smooth' });
        });
    });
  }

  return (<>
    <main>
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <span ref={dummy}></span>
    </main>

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Bạn đang nghĩ..." />
      <label>
        <img className="camera" src={camera} alt="" />
        <input type="file" onChange={handleImageAsFile} />
      </label>
      <button type="submit" disabled={!formValue}>Gửi</button>
    </form>
  </>)
}


function ChatMessage(props) {
  const { text, image_url } = props.message;

  const messageClass = 'received';

  return (<>
    <Linkify properties={{target: '_blank', style: {color: 'red', fontWeight: 'bold'}}}>
      <div className={`message ${messageClass}`}>
        { text ? <p>{text}</p> : <img src={image_url} alt="" /> }
      </div>
    </Linkify>
</>)
}


export default App;
