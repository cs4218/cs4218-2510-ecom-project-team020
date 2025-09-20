import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [DOB, setDOB] = useState("");
  const [answer, setAnswer] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/v1/auth/register", {
        name,
        email,
        password,
        phone,
        address,
        DOB,
        answer,
      });
      if (res && res.data.success) {
        toast.success("Register Successfully, please login");
        navigate("/login");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Layout title="Register - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">REGISTER FORM</h4>

          <div className="mb-3">
            <input
              type="text"
              id="exampleInputName1"
              aria-label="name"
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-control"
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <input
              type="email"
              id="exampleInputEmail1"
              aria-label="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="password"
              id="exampleInputPassword1"
              aria-label="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="text"
              id="exampleInputPhone1"
              aria-label="phone"
              placeholder="Enter Your Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="text"
              id="exampleInputaddress1"
              aria-label="address"
              placeholder="Enter Your Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="date"
              id="exampleInputDOB1"
              aria-label="dob"
              placeholder="Enter Your DOB"
              value={DOB}
              onChange={(e) => setDOB(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <div className="mb-3">
            <input
              type="text"
              id="exampleInputanswer1"
              aria-label="answer"
              placeholder="What is Your Favorite sports"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="form-control"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            REGISTER
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Register;
