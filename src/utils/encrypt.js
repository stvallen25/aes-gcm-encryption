export async function generateEncryptionKey() {
  return new Promise(async (resolve, reject) => {
    var aesKey = await makeAESKey();
    callOnStore(function (store) {
      store.put({ id: 1, aesKey });
      resolve({ aesKey });
    });
  });
}

export function loadDecryptionKey() {
  return new Promise((resolve, reject) => {
    callOnStore(function (store) {
      var getData = store.get(1);
      getData.onsuccess = async function () {
        var aesKey = getData.result.aesKey;
        resolve({ aesKey });
      };
    });
  });
}

export function callOnStore(fn_) {
  // This works on all devices/browsers, and uses IndexedDBShim as a final fallback
  var indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

  // Open (or create) the database
  var open = indexedDB.open("MyDatabase", 1);

  // Create the schema
  open.onupgradeneeded = function () {
    var db = open.result;
    var store = db.createObjectStore("MyObjectStore", { keyPath: "id" });
  };

  open.onsuccess = function () {
    // Start a new transaction
    var db = open.result;
    var tx = db.transaction("MyObjectStore", "readwrite");
    var store = tx.objectStore("MyObjectStore");

    fn_(store);

    // Close the db when the transaction is done
    tx.oncomplete = function () {
      db.close();
    };
  };
}

export async function encryptMessage(message) {
  const encoding = getMessageEncoding(message);
  const { aesKey } = await loadDecryptionKey();
  const iv = await makeIV();
  const cipherText = await encrypt(iv, aesKey, encoding);
  let buffer = Array.from(new Uint8Array(cipherText));
  let ivArrayTyped = Array.from(iv);
  localStorage.setItem(
    "PRIVI_KEY",
    JSON.stringify({ buffer, iv: ivArrayTyped })
  );
  console.log({ buffer });
}

export async function decryptMessage() {
  const { aesKey } = await loadDecryptionKey();
  const { buffer, iv: ivArrayTyped } = JSON.parse(
    localStorage.getItem("PRIVI_KEY")
  );
  const encrypted = Uint8Array.from(buffer);
  const iv = Uint8Array.from(ivArrayTyped);

  const recovered = await decrypt(iv, aesKey, encrypted);
  const msg = getMessageDecoding(recovered);
  return msg;
}

export function makeIV() {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

export function makeAESKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
  );
}

/**
 * Encrypt
 * @param {*} iv
 * @param {*} key
 * @param {*} data
 * @returns
 */
export function encrypt(iv, key, data) {
  return window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    data // ArrayBuffer of data you want to encrypt
  );
}

/**
 * Decrypt
 * @param {*} iv
 * @param {*} key
 * @param {*} data Uint8Array
 * @returns
 */
export async function decrypt(iv, key, data) {
  const cipherText = data.buffer;
  console.log(cipherText);
  return new Uint8Array(
    await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      cipherText //ArrayBuffer of the data
    )
  );
}

/**
 *
 * @param {*} message
 * @returns Uint8Array
 */
export function getMessageEncoding(message) {
  let enc = new TextEncoder();
  return enc.encode(message);
}

export function getMessageDecoding(decrypted) {
  let dec = new TextDecoder();
  const msg = dec.decode(decrypted);
  return msg;
}
