import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    }),
    databaseURL: "https://fidelidade-app-9671c-default-rtdb.firebaseio.com"
  });
}

export const config={api:{bodyParser:false}};

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  if(String(req.query?.key||"")!=="uai-media-20260929-7f3c1a9e") return res.status(403).json({error:"Forbidden"});
  try{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const data=Buffer.concat(chunks);
    if(!data.length||data.length>8*1024*1024)return res.status(400).json({error:"Invalid file"});
    const project=process.env.FIREBASE_PROJECT_ID||"fidelidade-app-9671c";
    const candidates=[project+".firebasestorage.app",project+".appspot.com"];
    let lastError=null;
    for(const bucketName of candidates){
      try{
        const bucket=admin.storage().bucket(bucketName);
        const file=bucket.file("menu/coxinha-uaiso-4g.mp4");
        await file.save(data,{metadata:{contentType:"video/mp4",cacheControl:"public,max-age=31536000,immutable"},resumable:false});
        const [url]=await file.getSignedUrl({action:"read",expires:"2035-01-01"});
        return res.status(200).json({success:true,bucket:bucketName,size:data.length,url});
      }catch(e){lastError=e}
    }
    throw lastError||new Error("Upload failed");
  }catch(e){
    console.error("tmp-media-upload",e);
    return res.status(500).json({error:e.message});
  }
}
