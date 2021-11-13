import React, { useRef, useState, useEffect } from "react";
import "./App.css";

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/auth";
import "firebase/compat/database";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";
import Linkify from "react-linkify";
import camera from "./camera.png";

import TimeAgo from "javascript-time-ago"
import vi from 'javascript-time-ago/locale/vi.json'
TimeAgo.addDefaultLocale(vi)
const timeAgo = new TimeAgo('en-US')

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
})

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();
const database = firebase.database();

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

  const messagesRef = firestore.collection("messages");
  var query = messagesRef.orderBy("createdAt").limitToLast(countValue);
  var [messages] = useCollectionData(query, { idField: "id" });

  const typingByRef = database.ref("typing_by");
  const [timestamp]= useState(Date.now());
  const [typingBy, setTypingBy] = useState(0);
  const [firstRender, setFirstRender] = useState(true);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (formValue.length === 0) { return; }

    const text = formValue;

    setFormValue("");

    await messagesRef.add({
      text: text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user.uid
    })

    endTyping();
    dummy.current.scrollIntoView({ behavior: "smooth" });
  }

  const onFileInputChange = (e) => {
    e.preventDefault();

    const file = e.target.files[0];
    if (!file) { return; }

    startTyping();

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
          });

          dummy.current.scrollIntoView({ behavior: "smooth" });
          e.target.value = null;
          endTyping();
        });
    });
  }

  const loadOlderMessages = (e) => {
    e.preventDefault();
    setCountValue(countValue + pageSize);
  }

  const onTextInputChange = (e) => {
    setFormValue(e.target.value);

    if (e.target.value) {
      startTyping();
    } else {
      endTyping();
    }
  }

  const startTyping = () => {
    if (typingBy > 0) { return; }

    typingByRef.set(timestamp);
  }

  const endTyping = () => {
    if (typingBy !== timestamp) { return; }

    typingByRef.set(0);
  }

  const isSomeoneTyping = () => {
    return typingBy > 0 && typingBy !== timestamp;
  }

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false);

      startTyping();

      typingByRef.on("value", (snapshot) => {
        setTypingBy(snapshot.val());
      }, (errorObject) => {
        console.log("The read failed: " + errorObject.name);
      });
    }
  });

  return (<>
    <main className={isSomeoneTyping() ? "main_typing" : ""}>
      {messages && messages.length >= pageSize && <button onClick={loadOlderMessages}>Tải tin nhắn cũ hơn</button>}
      {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
      <span ref={dummy}></span>
    </main>

    {isSomeoneTyping() && <div className="typing_indicator"><p>Đối phương đang viết...</p></div>}

    <form onSubmit={sendMessage}>
      <input value={formValue} onChange={onTextInputChange} placeholder="Bạn đang nghĩ..." />
      <label>
        <img className="camera" src={camera} alt="" />
        <input type="file" onChange={onFileInputChange} />
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
  const { createdAt, text, image_url } = props.message;

  const messageClass = "received";

  return (<>
    <Linkify properties={{target: "_blank", style: {color: "red", fontWeight: "bold"}}}>
      <div className={`message ${messageClass}`}>
        {text ? <p>{text}</p> : <img src={image_url} alt="" />}
        {text && createdAt && <p className="timestamp">{timeAgo.format(createdAt.toDate())}</p>}
      </div>
    </Linkify>
</>)
}


export default App;
