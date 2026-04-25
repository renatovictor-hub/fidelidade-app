importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBIsxfTBBWpO8J5UvcWbxIXtL68SDKfGjQ",
  authDomain: "fidelidade-app-9671c.firebaseapp.com",
  projectId: "fidelidade-app-9671c",
  messagingSenderId: "373498571854",
  appId: "1:373498571854:web:640b54cdae0cbd9790271f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'
  });
});
