import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from 'axios';
import Spinner from "../Spinner";

export default function PrivateRoute(){
    const [ok,setOk] = useState(false)
    const [auth,setAuth] = useAuth()

    useEffect(() => {
        let active = true; // avoid setting state after unmount
        const authCheck = async () => {
            try {
                const res = await axios.get("/api/v1/auth/user-auth");
                if (!active) return;
                setOk(!!res?.data?.ok);
            } catch {
                if (!active) return;
                setOk(false);
            }
        };
        if (auth?.token) authCheck();
        return () => {
            active = false;
        };
    }, [auth?.token]);

    return ok ? <Outlet /> : <Spinner path=""/>;
}