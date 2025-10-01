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
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!name) {
      newErrors.name = "Name is required";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters, include 1 uppercase and 1 special character";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{8,15}$/.test(phone)) {
      newErrors.phone = "Phone number must be 8–15 digits only";
    }

    if (!address) {
      newErrors.address = "Address is required";
    }

    if (!DOB) {
      newErrors.DOB = "Date of Birth is required";
    }

    if (!answer) {
      newErrors.answer = "Security answer is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
        toast.success("Registered Successfully, Please Login");
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
        <form onSubmit={handleSubmit} noValidate>
          <h4 className="title">REGISTER FORM</h4>

          <div className="mb-3">
            <input
              type="text"
              placeholder="Enter Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              aria-label="name"
              required
              autoFocus
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name}</div>
            )}
          </div>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              aria-label="email"
              required
            />
            {errors.email && (
              <div className="invalid-feedback">{errors.email}</div>
            )}
          </div>
          <div className="mb-3">
            <input
              type="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              aria-label="password"
              required
            />
            {errors.password && (
              <div className="invalid-feedback">{errors.password}</div>
            )}
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Enter Your Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`form-control ${errors.phone ? "is-invalid" : ""}`}
              aria-label="phone"
              required
            />
            {errors.phone && (
              <div className="invalid-feedback">{errors.phone}</div>
            )}
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Enter Your Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`form-control ${errors.address ? "is-invalid" : ""}`}
              aria-label="address"
              required
            />
            {errors.address && (
              <div className="invalid-feedback">{errors.address}</div>
            )}
          </div>
          <div className="mb-3">
            <input
              type="date"
              placeholder="Enter Your DOB"
              value={DOB}
              onChange={(e) => setDOB(e.target.value)}
              className={`form-control ${errors.DOB ? "is-invalid" : ""}`}
              aria-label="dob"
              required
            />
            {errors.DOB && (
              <div className="invalid-feedback">{errors.DOB}</div>
            )}
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="What is Your Favorite sports"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={`form-control ${errors.answer ? "is-invalid" : ""}`}
              aria-label="answer"
              required
            />
            {errors.answer && (
              <div className="invalid-feedback">{errors.answer}</div>
            )}
          </div>
          <div className="d-flex justify-content-center">
            <button type="submit" className="btn btn-primary">
              REGISTER
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default Register;