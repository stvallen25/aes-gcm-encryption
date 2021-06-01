import { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as Crypto from "./utils/encrypt";
let aesKey;
let ciphertext;
let iv;

/*
  Fetch the contents of the "message" textbox, and encode it
  in a form we can use for the encrypt operation.
  */
function getMessageEncoding(message) {
  let enc = new TextEncoder();
  return enc.encode(message);
}

/**
 * Encrypt message using aesKey and value
 * @param {*} key
 * @param {*} messsage
 * @returns encrypted message
 */
async function encryptMessage(message) {
  // The iv must never be reused with a given key.
  const encoded = getMessageEncoding(message);

  ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    encoded
  );
  decryptFunc();
  let buffer = new Uint8Array(ciphertext);
  console.log({ buffer });

  return JSON.stringify(buffer);
}

const decryptFunc = async () => {
  const decrypted = await getDecrypted();

  let dec = new TextDecoder();
  const reveresed = dec.decode(decrypted);
  console.log({ reveresed });
};

const getDecrypted = async () => {
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    ciphertext
  );
};
/*
  Fetch the ciphertext and decrypt it.
  Write the decrypted message into the "Decrypted" box.
  */
async function decryptMessage() {
  console.log("decryptMessage.cipherText", ciphertext);
  console.log("decryptMessage.iv", iv);
  console.log("decryptMessage.key", aesKey);

  await decryptFunc();
}

function App() {
  const [text, setText] = useState("");
  const [encrypted, setEncrypted] = useState("");
  const [decrypted, setDecrypted] = useState("");
  useEffect(() => {
    const func = async () => {
      iv = window.crypto.getRandomValues(new Uint8Array(12));
      aesKey = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );
    };
    func();
  });

  const handleEncrypt = async (event) => {
    event.preventDefault();
    const encryptedMsg = await encryptMessage(text);
    setEncrypted(encryptedMsg);
  };

  const handleDecrypted = async (event) => {
    event.preventDefault();

    try {
      await decryptFunc();
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <div className="App">
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => Crypto.encryptMessage("aaa")}> Encrypt </button>
      <button onClick={() => Crypto.decryptMessage()}> Decrypt </button>

      <div>
        <button onClick={() => Crypto.generateEncryptionKey()}>
          encryptDataSaveKey
        </button>
        <button onClick={() => Crypto.loadDecryptionKey()}>
          loadKeyDecryptData
        </button>
      </div>

      <label> {encrypted} </label>
      <label> {decrypted} </label>
    </div>
  );
}

export default App;
