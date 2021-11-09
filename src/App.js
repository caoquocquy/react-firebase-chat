import React, { useRef, useState } from "react";
import "./App.css";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/auth";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Linkify from "react-linkify";
import camera from "./camera.png";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
})

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();


function App() {
  const [user] = useAuthState(auth);
  const [showMessage, setShowMessage] = useState(true);

  return (
    <div className="App">
      <header>
        <SignOut />
        { user && <button onClick={() => setShowMessage(!showMessage)}>{ showMessage ? "Hình Ảnh" : "Tin Nhắn" }</button> }
      </header>

      <section>
        { user && showMessage && <ChatRoom /> }
        { user && !showMessage && <Photos /> }
        { !user && <SignIn /> }
      </section>
    </div>
  );
}

function SignIn() {
  const onChange = (e) => {
    const password = e.target.value;

    if (password.length === parseInt(process.env.REACT_APP_PASSWORD_LENGTH)) {
      auth.signInWithEmailAndPassword(process.env.REACT_APP_SHARED_EMAIL, password);
    }
  }

  return (
    <div>
      <input id="password" type="password" maxlength="6" placeholder="Vui lòng nhập mật mã..." onChange={onChange} />
    </div>
  )
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Thoát</button>
  )
}

function ChatRoom() {
  const pageSize = 10;
  const dummy = useRef();
  const [formValue, setFormValue] = useState("");
  const [countValue, setCountValue] = useState(pageSize);
  const [user] = useAuthState(auth);

  var messagesRef = firestore.collection("messages");
  var query = messagesRef.orderBy("createdAt").limitToLast(countValue);
  var [messages] = useCollectionData(query, { idField: "id" });

  const sendMessage = async (e) => {
    console.log(user.uid);

    e.preventDefault();

    if (formValue.length === 0) { return; }

    const text = formValue;

    setFormValue("");

    await messagesRef.add({
      text: text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user.uid
    })

    dummy.current.scrollIntoView({ behavior: "smooth" });
  }

  const handleImageAsFile = (e) => {
    e.preventDefault();

    const file = e.target.files[0]
    if (!file) { return; }

    const ref = storage.ref(`/images/${Date.now()}_${file.name}`);
    const uploadTask = ref.put(file);

    uploadTask.on("state_changed", console.log, console.error, () => {
      ref
        .getDownloadURL()
        .then((url) => {
          messagesRef.add({
            image_url: url,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            uid: user.uid
          })

          dummy.current.scrollIntoView({ behavior: "smooth" });
          e.target.value = null;
        });
    });
  }

  const handleLoadMore = (e) => {
    e.preventDefault();

    setCountValue(countValue + pageSize);
  }

  return (<>
    <main>
      {messages && messages.length >= pageSize && <button onClick={handleLoadMore}>Tải tin nhắn cũ hơn</button>}
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <span ref={dummy}></span>
    </main>

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Bạn đang nghĩ..." />
      <label>
        <img className="camera" src={camera} alt="" />
        <input type="file" onChange={handleImageAsFile} />
      </label>
    </form>
  </>)
}

function Photos() {
  const messagesRef = firestore.collection("messages");
  const query = messagesRef.where("image_url", "!=", "null")
  const [messages] = useCollectionData(query, { idField: "id" });

  return (<>
    <main className="photos">
      {
        messages &&
        messages.sort((msg1, msg2) => {
                  if (msg1.createdAt < msg2.createdAt) { return 1; }
                  if (msg1.createdAt > msg2.createdAt) { return -1; }
                  return 0;
                })
                .map(msg => <ChatMessage key={msg.id} message={msg} />)
      }
    </main>
  </>)
}

function ChatMessage(props) {
  const { text, image_url } = props.message;

  const messageClass = "received";

  return (<>
    <Linkify properties={{target: "_blank", style: {color: "red", fontWeight: "bold"}}}>
      <div className={`message ${messageClass}`}>
        { text ? <p>{text}</p> : <img src={image_url} alt="" /> }
      </div>
    </Linkify>
</>)
}


export default App;
