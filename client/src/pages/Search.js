import React from "react";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Search = () => {
  const [values] = useSearch();
  const [cart, setCart] = useCart();
  const navigate = useNavigate();

  const results = values?.results || [];
  const hasResults = results.length > 0;

  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1>Search Results</h1>
          <h6>
            {!hasResults ? "No Products Found" : `Found ${results.length}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {results.map((p) => (
              <div key={p._id} className="card m-2" style={{ width: "18rem" }}>
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name || "Product"}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name || "Unnamed Product"}</h5>
                  <p className="card-text">
                    {p.description
                      ? `${p.description.substring(0, 30)}...`
                      : "No description available"}
                  </p>
                  <p className="card-text"> $ {p.price || 0}</p>
                  <button
                    className="btn btn-primary ms-1"
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
                    className="btn btn-secondary ms-1"
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
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
