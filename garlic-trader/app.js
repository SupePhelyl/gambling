import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";  
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";  
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";  

window.addEventListener("DOMContentLoaded", () => {
  const encodedConfig = {  
    apiKey: "QUl6YVN5Q280RTg4ZUpydW1TcGgxZ3lpelB4TUcybm4yWXlNVng4",  
    authDomain: "Z2llbGRhLTIwMTcyLmZpcmViYXNlYXBwLmNvbQ==",  
    projectId: "Z2llbGRhLTIwMTcy",  
    storageBucket: "Z2llbGRhLTIwMTcyLmFwcHNwb3QuY29t",  
    messagingSenderId: "OTg1NDU1NzcwODA1",  
    appId: "MTo5ODU0NTU3NzA4MDU6d2ViOmE4MGFhZjUzNmE2YTVkMDY0YzUyZmM="  
  };  
  const firebaseConfig = {};  
  for (const key in encodedConfig) firebaseConfig[key] = atob(encodedConfig[key]);  
  
  const app = initializeApp(firebaseConfig);  
  const db = getFirestore(app);  
  const auth = getAuth(app);  
  
  const loginBtn = document.getElementById("login-btn");  
  const logoutBtn = document.getElementById("logout-btn");  
  const garlicCount = document.getElementById("garlic-count");  
  const moneyCount = document.getElementById("money-count");  
  
  let currentUser = null;  
  
  loginBtn.onclick = async () => {  
    const provider = new GoogleAuthProvider();  
    await signInWithPopup(auth, provider);  
  };  
  
  logoutBtn.onclick = async () => await signOut(auth);  
  
  onAuthStateChanged(auth, async user => {  
    const marketTab = document.querySelector('[data-tab="market"]');  
    const farmTab = document.querySelector('[data-tab="farm"]');  
    if (user) {  
      currentUser = user;  
      loginBtn.classList.add("hidden");  
      logoutBtn.classList.remove("hidden");  
      marketTab.classList.remove("hidden");  
      farmTab.classList.remove("hidden");  
      await loadOrCreatePlayer(user);  
      await loadOffers();  
    } else {  
      currentUser = null;  
      loginBtn.classList.remove("hidden");  
      logoutBtn.classList.add("hidden");  
      garlicCount.textContent = "-";  
      moneyCount.textContent = "-";  
      marketTab.classList.add("hidden");  
      farmTab.classList.add("hidden");  
      document.querySelector('[data-tab="toplist"]').click();  
    }  
  });  
  
  async function loadOrCreatePlayer(user) {  
    const ref = doc(db, "garlic-leaderboard", user.uid);  
    const snap = await getDoc(ref);  
    if (!snap.exists()) {  
      await setDoc(ref, { name: user.displayName, garlic: 0, money: 100 });  
      garlicCount.textContent = 0;  
      moneyCount.textContent = 100;  
    } else {  
      const data = snap.data();  
      garlicCount.textContent = data.garlic;  
      moneyCount.textContent = data.money;  
    }  
  }  
  
  async function loadTopLists() {  
    const garlicDiv = document.getElementById("top-garlic");  
    const moneyDiv = document.getElementById("top-money");  
    try {  
      const ref = collection(db, "garlic-leaderboard");  
      const garlicQ = query(ref, orderBy("garlic", "desc"), limit(10));  
      const moneyQ = query(ref, orderBy("money", "desc"), limit(10));  
      const garlicSnap = await getDocs(garlicQ);  
      const moneySnap = await getDocs(moneyQ);  
      garlicDiv.innerHTML = "<ol>" + garlicSnap.docs.map(doc => `<li>${doc.data().name}: ${doc.data().garlic}</li>`).join("") + "</ol>";  
      moneyDiv.innerHTML = "<ol>" + moneySnap.docs.map(doc => `<li>${doc.data().name}: $${doc.data().money}</li>`).join("") + "</ol>";  
    } catch (e) {  
      garlicDiv.textContent = moneyDiv.textContent = "Błąd ładowania top list.";  
      console.error(e);  
    }  
  }  
  
  loadTopLists();  
  
  document.querySelectorAll('.tab').forEach(tab => {  
    tab.addEventListener('click', () => {  
      if ((tab.dataset.tab === 'market' || tab.dataset.tab === 'farm') && !currentUser) return;  
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));  
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));  
      tab.classList.add('active');  
      document.getElementById(tab.dataset.tab).classList.remove('hidden');  
    });  
  });  
  
  document.querySelectorAll('.subtab').forEach(tab => {  
    tab.addEventListener('click', () => {  
      document.querySelectorAll('.subtab').forEach(t => t.classList.remove('active'));  
      document.querySelectorAll('.subtab-content').forEach(c => c.classList.add('hidden'));  
      tab.classList.add('active');  
      document.getElementById(tab.dataset.subtab).classList.remove('hidden');  
    });  
  });  
  
  // Obsługa formularzy ofert  
  document.getElementById("submit-buy-offer").onclick = async () => {  
    const name = document.getElementById("buy-name").value;  
    const amount = parseInt(document.getElementById("buy-amount").value);  
    const price = parseFloat(document.getElementById("buy-price").value);  
    if (currentUser && name && amount > 0 && price >= 0) {  
      await addDoc(collection(db, "offers"), {  
        uid: currentUser.uid,  
        user: currentUser.displayName,  
        type: "buy",  
        name,  
        amount,  
        price  
      });  
      document.getElementById("buy-offer-form").classList.add("hidden");  
      loadOffers();  
    }  
  };  
  
  document.getElementById("submit-sell-offer").onclick = async () => {  
    const name = document.getElementById("sell-name").value;  
    const amount = parseInt(document.getElementById("sell-amount").value);  
    const price = parseFloat(document.getElementById("sell-price").value);  
    if (currentUser && name && amount > 0 && price >= 0) {  
      await addDoc(collection(db, "offers"), {  
        uid: currentUser.uid,  
        user: currentUser.displayName,  
        type: "sell",  
        name,  
        amount,  
        price  
      });  
      document.getElementById("sell-offer-form").classList.add("hidden");  
      loadOffers();  
    }  
  };  
  
  async function loadOffers() {  
    const offersRef = collection(db, "offers");  
    const offers = await getDocs(offersRef);  
    const buyContainer = document.getElementById("buy-offers");  
    const sellContainer = document.getElementById("sell-offers");  
    buyContainer.innerHTML = "";  
    sellContainer.innerHTML = "";  
  
    offers.forEach(doc => {  
      const o = doc.data();  
      const el = document.createElement("div");  
      el.className = "offer";  
      el.innerHTML = `  
        <strong>${o.name}</strong><br>  
        Użytkownik: ${o.user}<br>  
        Ilość: ${o.amount}<br>  
        Cena: $${o.price}<br>  
        <button class="button">Handluj</button>  
      `;  
      if (o.type === "buy") buyContainer.appendChild(el);  
      else sellContainer.appendChild(el);  
    });  
  }

  // Dodajemy pokazywanie/ukrywanie formularzy kupna/sprzedaży (dodatkowo)
  document.getElementById("add-buy-offer").onclick = () => {
    document.getElementById("buy-offer-form").classList.remove("hidden");
  };
  document.getElementById("close-buy-form").onclick = () => {
    document.getElementById("buy-offer-form").classList.add("hidden");
  };

  document.getElementById("add-sell-offer").onclick = () => {
    document.getElementById("sell-offer-form").classList.remove("hidden");
  };
  document.getElementById("close-sell-form").onclick = () => {
    document.getElementById("sell-offer-form").classList.add("hidden");
  };

});
