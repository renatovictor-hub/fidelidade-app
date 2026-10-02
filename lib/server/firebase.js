import admin from "firebase-admin";

export function getFirebaseAdmin(){
  if(!admin.apps.length){
    const projectId=String(process.env.FIREBASE_PROJECT_ID||"").trim();
    const databaseURL=String(process.env.FIREBASE_DATABASE_URL||`https://${projectId}-default-rtdb.firebaseio.com`).trim();
    if(!projectId||!process.env.FIREBASE_CLIENT_EMAIL||!process.env.FIREBASE_PRIVATE_KEY)throw new Error("Firebase service account environment variables are required");
    admin.initializeApp({
      credential:admin.credential.cert({
        projectId,
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
