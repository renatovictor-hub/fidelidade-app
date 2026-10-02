import admin from "firebase-admin";

export function getFirebaseAdmin(){
  if(!admin.apps.length){
    const databaseURL=String(process.env.FIREBASE_DATABASE_URL||"https://fidelidade-app-9671c-default-rtdb.firebaseio.com").trim();
    admin.initializeApp({
      credential:admin.credential.cert({
        projectId:process.env.FIREBASE_PROJECT_ID,
        clientEmail:process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:String(process.env.FIREBASE_PRIVATE_KEY||"").replace(/\\n/g,"\n")
      }),
      databaseURL
    });
  }
  return admin;
}

export function getDb(){
  return getFirebaseAdmin().database();
}
