// import { getDatabase, ref, push, set } from "firebase/database";
// import * as Auth from "/components/auth/auth";

// export const registerNanosInFirebase = (nanoObj) => {
//     const db = getDatabase();
//     const uid = Auth.getUser();
//     const nanoListRef = ref(db, `/users/${uid}/RegisteredNanos/`);
//     const nanoId = push(nanoListRef);
  
//     set(nanoId, nanoObj);
//     return nanoId.key;
//   };
  