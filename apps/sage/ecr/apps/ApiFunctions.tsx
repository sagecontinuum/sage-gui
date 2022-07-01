import React, { useEffect, useState } from "react";
import { List, ListItem } from "@mui/material";

const TodosContext = React.createContext({
  todos: [],
  fetchTodos: () => {},
});

export default function RegistrationKeyLists() {
  const [todos, setTodos] = useState([]);
  const fetchTodos = async () => {
    const response = await fetch("http://localhost:8000/todo");
    const todos = await response.json();
    setTodos(todos.data);
    console.log(todos)
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <TodosContext.Provider value={{ todos, fetchTodos }}>
      <List>
        {todos.map((todo) => (
          <ListItem> Key {todo.id}: {todo.item}</ListItem>
        ))}
      </List>
    </TodosContext.Provider>
  );
}
