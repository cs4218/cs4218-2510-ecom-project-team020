import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="container-fluid">
        <h1 className="text-center bg-light p-3">Privacy Policy</h1>
        <div className="row contactus align-items-center">
          <div className="col-md-6 ">
            <img
              src="/images/privacy.jpeg"
              alt="contactus"
              style={{ width: "100%" }}
            />
          </div>
          <div className="col-md-4 text-center">
            <p>
              At Virtual Vault, your privacy is important to us. We are
              dedicated to handling your personal information responsibly and
              transparently. This policy outlines the kinds of data we may
              collect when you use our website and how we use it to improve your
              experience.
            </p>
            <p>
              By continuing to browse or use our services, you consent to the
              practices described in this policy. If you are not comfortable
              with these terms, we encourage you to discontinue use of our site.
              Protecting your trust is our priority, and we will always strive
              to keep your information secure.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
