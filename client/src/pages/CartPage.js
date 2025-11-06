import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";
import { AiFillWarning } from "react-icons/ai";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/CartStyles.css";

const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [clientToken, setClientToken] = useState("");
  const [instance, setInstance] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Calculates total price in cart
  const getTotalPrice = () => {
    try {
      const total = cart.reduce((sum, item, i) => {
        const price = item?.price;

        if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
          throw new TypeError(`Invalid price at index ${i}: ${price}`);
        }
        return sum + price;
      }, 0);
      return total.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
    } catch (error) {
      console.log(error);
      return "Error in getTotalPrice";
    }
  };

  //delete item
  const removeCartItem = (pid) => {
    try {
      let myCart = [...cart];
      let index = myCart.findIndex((item) => item._id === pid);
      if (index !== -1) {
        myCart.splice(index, 1);
        setCart(myCart);
        localStorage.setItem("cart", JSON.stringify(myCart));
      }
    } catch (error) {
      console.log(error);
      return "Error in removeCartItem";
    }
  };

  //get payment gateway token
  const getToken = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/braintree/token");
      setClientToken(data?.clientToken);
    } catch (error) {
      console.log(error);
      toast.error("Error in getToken");
    }
  };
  useEffect(() => {
    getToken();
  }, [auth?.token]);

  //handle payments
  const handlePayment = async () => {
    try {
      setLoading(true);
      const { nonce } = await instance.requestPaymentMethod();
      const { data } = await axios.post("/api/v1/product/braintree/payment", {
        nonce,
        cart,
      });
      setLoading(false);
      localStorage.removeItem("cart");
      setCart([]);
      navigate("/dashboard/user/orders");
      toast.success("Payment Completed Successfully ");
    } catch (error) {
      console.log(error);
      setLoading(false);
      toast.error("Payment failed. Please try again.");
    }
  };
  return (
    <Layout>
      <div className=" cart-page">
        <div className="row">
          <div className="col-md-12">
            <h1 className="text-center bg-light p-2 mb-1">
              {!auth?.user
                ? "Hello Guest"
                : `Hello  ${auth?.token && auth?.user?.name}`}
              <p className="text-center">
                {cart?.length
                  ? `You Have ${cart.length} items in your cart ${
                      auth?.token ? "" : "please login to checkout !"
                    }`
                  : " Your Cart Is Empty"}
              </p>
            </h1>
          </div>
        </div>
        <div className="container ">
          <div className="row">
            <div className="col-md-7 col-12">
              {cart?.map((p) => (
                <div className="row card flex-column flex-md-row mb-3" key={p._id}>
                  <div className="col-md-4 col-12 text-center text-md-start">
                    <img
                      src={`/api/v1/product/product-photo/${p._id}`}
                      className="card-img-top img-fluid"
                      alt={p.name}
                      style={{ maxHeight: "130px", objectFit: "contain" }}
                    />
                  </div>
                  <div className="col-md-4 col-12 text-center text-md-start">
                    <h6 className="mb-1">{p.name}</h6>
                    <p className="mb-1 text-muted">{p.description.substring(0, 30)}...</p>
                    <p className="mb-1 fw-bold">${p.price}</p>
                  </div>
                  <div className="col-md-4 col-12 d-flex align-items-center justify-content-center justify-content-md-end cart-remove-btn">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeCartItem(p._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-md-5 col-12 cart-summary">
              <div className="card p-3">
                <h2 className="h4 mb-3">Cart Summary</h2>
                <p className="text-muted mb-3">Total | Checkout | Payment</p>
                <hr />
                <h4 className="mb-4">Total: {getTotalPrice()}</h4>
                
                {auth?.user?.address ? (
                  <div className="mb-3">
                    <h6 className="mb-2">Current Address</h6>
                    <p className="text-muted mb-2 small">{auth?.user?.address}</p>
                    <button
                      className="btn btn-outline-warning btn-sm w-100"
                      onClick={() => navigate("/dashboard/user/profile")}
                    >
                      Update Address
                    </button>
                  </div>
                ) : (
                  <div className="mb-3">
                    {auth?.token ? (
                      <button
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() => navigate("/dashboard/user/profile")}
                      >
                        Update Address
                      </button>
                    ) : (
                      <button
                        className="btn btn-outline-warning btn-sm w-100"
                        onClick={() =>
                          navigate("/login", {
                            state: "/cart",
                          })
                        }
                      >
                        Please Login to checkout
                      </button>
                    )}
                  </div>
                )}
                
                <div className="mt-2">
                  {!clientToken || !auth?.token || !cart?.length ? (
                    <p className="text-muted text-center">Login to enable checkout</p>
                  ) : (
                    <>
                      <DropIn
                        options={{
                          authorization: clientToken,
                          paypal: {
                            flow: "vault",
                          },
                        }}
                        onInstance={(instance) => setInstance(instance)}
                      />

                      <button
                        className="btn btn-primary w-100 mt-3"
                        onClick={handlePayment}
                        disabled={loading || !instance || !auth?.user?.address}
                      >
                        {loading ? "Processing ...." : "Make Payment"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
