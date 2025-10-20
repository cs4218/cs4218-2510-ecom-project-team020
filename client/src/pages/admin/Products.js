// client/src/pages/admin/Products.js
import React, { useState, useEffect } from "react";
import AdminMenu from "../../components/AdminMenu";
import Layout from "./../../components/Layout";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Products = () => {
  const [products, setProducts] = useState([]);

  const getAllProducts = async () => {
    try {
      const { data } = await axios.get("/api/v1/product/get-product");
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch products");
      setProducts([]);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  return (
    <Layout>
      <div className="row" data-test="products-page">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9 ">
          <h1 className="text-center" data-test="products-heading">
            All Products List
          </h1>

          {!products?.length && (
            <div className="text-muted" data-test="products-empty">
              No products found.
            </div>
          )}

          <div className="d-flex flex-wrap" data-test="products-grid">
            {products?.map((p, i) => (
              <Link
                key={p?._id || i}
                to={`/dashboard/admin/product/${p?.slug}`}
                className="product-link"
                data-test="product-link"
              >
                <div
                  className="card m-2"
                  style={{ width: "18rem" }}
                  data-test="product-card"
                  data-product-id={p?._id}
                >
                  <img
                    src={`/api/v1/product/product-photo/${p?._id}`}
                    className="card-img-top"
                    alt={p?.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title" data-test="product-name">
                      {p?.name}
                    </h5>
                    <p className="card-text" data-test="product-description">
                      {p?.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
