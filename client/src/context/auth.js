import React, { useState, useContext, createContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        user: null,
        token: "",
    });

    //default axios
    axios.defaults.headers.common["Authorization"] = auth?.token;

    useEffect(() => {
        const data = localStorage.getItem("auth");
        if (data) {
            try {
                const parseData = JSON.parse(data);
                setAuth({
                    ...auth,
                    user: parseData.user,
                    token: parseData.token,
                });
            } catch (e) {
                console.error("Failed to parse auth from localStorage", e);
            }
        }
        //eslint-disable-next-line
    }, []);
    return (
        <AuthContext.Provider value={[auth, setAuth]}>
            {children}
        </AuthContext.Provider>
    );
};

// custom hook
const useAuth = () => useContext(AuthContext);

export { useAuth, AuthProvider };