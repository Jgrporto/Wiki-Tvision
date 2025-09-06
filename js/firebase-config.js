// js/firebase-config.js

// Importa as funções que você precisa dos SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// A configuração do seu app da web do Firebase (que você forneceu)
const firebaseConfig = {
  apiKey: "AIzaSyCmodZ5Cx3QxuSwN3KSHhRqbhWq2PBTqQI",
  authDomain: "wiki-tvision.firebaseapp.com",
  projectId: "wiki-tvision",
  storageBucket: "wiki-tvision.appspot.com",
  messagingSenderId: "1038773393370",
  appId: "1:1038773393370:web:b1325100e48d6f677512e3"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Cloud Firestore e obtém uma referência ao serviço
const db = getFirestore(app);

// Inicializa o Cloud Storage e obtém uma referência ao serviço
const storage = getStorage(app);

// Exporta as instâncias do DB e do Storage para usar em outros módulos
export { db, storage };