import React, { useState, useEffect } from "react";
import Layout from "./../components/Layout";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import toast from "react-hot-toast";
import "../styles/ProductDetailsStyles.css";

const ProductDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [product, setProduct] = useState({});
  const [relatedProducts, setRelatedProducts] = useState([]);

  // initial details
  useEffect(() => {
    if (params?.slug) {
      getProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.slug]);

  const getProduct = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/get-product/${params.slug}`
      );
      // Set product even if some fields are null
      if (data && data.product) {
        setProduct(data.product);
        // Only get similar products if category is present
        if (data.product._id && data.product.category?._id) {
          getSimilarProduct(data.product._id, data.product.category._id);
        }
      } else {
        setProduct({});
      }
    } catch (error) {
      console.log(error);
      setProduct({});
    }
  };

  //get similar product
  const getSimilarProduct = async (pid, cid) => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/related-product/${pid}/${cid}`
      );
      setRelatedProducts(data?.products || []);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <Layout>
      <div className="row container product-details">
        <div className="col-md-6">
          {product._id ? (
            <img
              src={`/api/v1/product/product-photo/${product._id}`}
              className="card-img-top"
              alt={product.name || "Product"}
              height="300"
              width={"350px"}
            />
          ) : (
            <div
              className="d-flex align-items-center justify-content-center bg-light"
              style={{ height: "300px", width: "350px" }}
            >
              <span className="text-muted">No Image Available</span>
            </div>
          )}
        </div>
        <div className="col-md-6 product-details-info">
          <h1 className="text-center">Product Details</h1>
          <hr />
          <h6>Name : {product.name || "Loading..."}</h6>
          <h6>Description : {product.description || "Loading..."}</h6>
          <h6>
            Price :
            {product?.price
              ? product.price.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })
              : " Loading..."}
          </h6>
          <h6>
            Category :{" "}
            {product?.category === null
              ? "Uncategorized"
              : product?.category?.name || "Loading..."}
          </h6>
          <button
            className="btn btn-secondary ms-1"
            onClick={() => {
              setCart([...cart, product]);
              localStorage.setItem("cart", JSON.stringify([...cart, product]));
              toast.success("Item Added to cart");
            }}
          >
            ADD TO CART
          </button>
        </div>
      </div>
      <hr />
      <div className="row container similar-products">
        <h4>Similar Products ➡️</h4>
        {relatedProducts.length < 1 && (
          <p className="text-center">
            {product?.category === null
              ? "No similar products available - product is uncategorized"
              : "No Similar Products found"}
          </p>
        )}
        <div className="d-flex flex-wrap">
          {relatedProducts?.map((p) => (
            <div className="card m-2" key={p._id}>
              <img
                src={`/api/v1/product/product-photo/${p._id}`}
                className="card-img-top"
                alt={p.name || "Product"}
              />
              <div className="card-body">
                <div className="card-name-price">
                  <h5 className="card-title">{p.name || "Unnamed Product"}</h5>
                  <h5 className="card-title card-price">
                    {p.price
                      ? p.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })
                      : "$0.00"}
                  </h5>
                </div>
                <p className="card-text ">
                  {p.description
                    ? `${p.description.substring(0, 60)}...`
                    : "No description available"}
                </p>
                <div className="card-name-price">
                  <button
                    className="btn btn-info ms-1"
                    onClick={() => {
                      if (p.slug) {
                        navigate(`/product/${p.slug}`);
                      }
                    }}
                    disabled={!p.slug}
                  >
                    More Details
                  </button>
                  <button
                    className="btn btn-dark ms-1"
                    onClick={() => {
                      setCart([...cart, p]);
                      localStorage.setItem(
                        "cart",
                        JSON.stringify([...cart, p])
                      );
                      toast.success("Item Added to cart");
                    }}
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetails;
