import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import AdminMenu from "../../components/AdminMenu";
import axios from "axios";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/api/v1/auth/all-users");
        setUsers(Array.isArray(data?.users) ? data.users : []);
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch users");
        setUsers([]);
      }
    })();
  }, []);

  return (
    <Layout title="Dashboard - All Users">
      <div className="container-fluid m-3 p-3" data-test="users-page">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1 data-test="users-heading">All Users</h1>

            {!users.length && (
              <p className="text-muted" data-test="users-empty">
                No users found.
              </p>
            )}

            <ul className="list-group" data-test="users-list">
              {users.map((u, i) => {
                const truncate = (text, length = 40) =>
                  text?.length > length ? text.slice(0, length) + "..." : text;

                return (
                  <li
                    key={u._id || i}
                    className="list-group-item text-truncate"
                    style={{ maxWidth: "1000px" }}
                    title={`${u.name} — ${u.email}`} // shows full text on hover
                  >
                    <strong>{truncate(u.name, 25)}</strong> — {truncate(u.email, 40)}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
