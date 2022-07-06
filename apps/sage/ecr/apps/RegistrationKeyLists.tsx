import React, { useEffect, useState } from "react";
import { List, ListItem } from "@mui/material";

const TodosContext = React.createContext({
  regKeys: [],
  fetchRegKeys: () => {},
});

export default function RegistrationKeyLists() {
  const [regKeys, setRegKeys] = useState([]);
  const fetchRegKeys = async () => {
    const response = await fetch("http://localhost:8000/registration-key-lists");
    const regKeys = await response.json();
    setRegKeys(regKeys.data);
    console.log(regKeys)
  };

  useEffect(() => {
    fetchRegKeys();
  }, []);

  return (
    <TodosContext.Provider value={{ regKeys, fetchRegKeys }}>
      <List>
        {regKeys.map((todo) => (
          <ListItem> Key {todo.id}: {todo.item}</ListItem>
        ))}
      </List>
    </TodosContext.Provider>
  );
}
