import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getStorage,
  ref as sRef
} from "firebase/storage";
import {
  getDatabase,
  onValue,
  ref,
  set,
  push,
  update,
  remove
} from "firebase/database";
import {
  getAuth
} from "firebase/auth";


const firebaseConfig = {
    apiKey: "AIzaSyCQ2ljbk1AxDfYXeFmcFze7az2H9O8d3d4",
    authDomain: "sage-518e6.firebaseapp.com",
    databaseURL: "https://sage-518e6-default-rtdb.firebaseio.com",
    projectId: "sage-518e6",
    storageBucket: "sage-518e6.appspot.com",
    messagingSenderId: "228867303454",
    appId: "1:228867303454:web:9ae398c77038ead14e660f",
    measurementId: "G-VL5S00D0X8"
  };

export const firebase = initializeApp(firebaseConfig);
export const auth = getAuth(firebase);
export const database = getDatabase(firebase);
export const storage = getStorage();

// data functions
export const useData = (path, transform) => {
  const [data, setData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const dbRef = ref(database, path);
    return onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        setData(transform ? transform(val) : val);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        setData(null);
        setIsLoading(false);
        setError(error);
      }
    );
  }, [path, transform]);
  return [data, isLoading, error];
};

export const setData = (path, value) => set(ref(database, path), value);
export const pushData = (path, value) => push(ref(database, path), value);
export const updateData = (path, value) => update(ref(database, path), value);
export const removeAtPath = (path) => {
  remove(ref(database, path));
};


export const deleteData = (dataPath) => {
    const listRef = ref(database, dataPath);
    remove(listRef);
  };


  
 