import React from "react";
import Layout from "./../components/Layout";

const About = () => {
  return (
    <Layout title={"About us - Ecommerce app"}>
      <div className="row contactus">
        <div className="col-md-6">
          <img
            src="/images/about.jpeg"
            alt="about us"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-6">
          <div className="p-3">
            <h2 className="mb-4">About Our Store</h2>
            <p className="text-justify mb-3">
              Welcome to our premier ecommerce destination! We are passionate
              about bringing you the finest selection of products at unbeatable
              prices. Since our founding, we have been committed to providing
              exceptional customer service and quality merchandise.
            </p>
            <p className="text-justify mb-3">
              Our mission is to make online shopping convenient, secure, and
              enjoyable for everyone. We carefully curate our product catalog to
              ensure that every item meets our high standards of quality and
              value.
            </p>
            <p className="text-justify mb-3">
              With fast shipping, easy returns, and 24/7 customer support, we
              strive to exceed your expectations at every step of your shopping
              journey. Thank you for choosing us as your trusted online shopping
              partner.
            </p>
            <div className="mt-4">
              <h5>Why Choose Us?</h5>
              <ul className="list-unstyled mt-3">
                <li className="mb-2">✓ Premium quality products</li>
                <li className="mb-2">✓ Competitive pricing</li>
                <li className="mb-2">✓ Fast and reliable shipping</li>
                <li className="mb-2">✓ Secure payment processing</li>
                <li className="mb-2">✓ Excellent customer service</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
