import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import AdminMenu from "../../components/AdminMenu";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/auth";
import moment from "moment";
import { Select } from "antd";
const { Option } = Select;

const AdminOrders = () => {
  const [status] = useState([
    "Not Processed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ]);
  const [orders, setOrders] = useState([]);
  const [auth] = useAuth();

  const getOrders = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/all-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch orders");
      setOrders([]);
    }
  };

  useEffect(() => {
    if (auth?.token) getOrders();
  }, [auth?.token]);

  const handleChange = async (orderId, value) => {
    try {
      await axios.put(`/api/v1/auth/order-status/${orderId}`, { status: value });
      await getOrders();
      toast.success("Order status updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  return (
    <Layout title={"All Orders Data"}>
      <div className="row dashboard">
        <div className="col-md-3">
          <AdminMenu />
        </div>
        <div className="col-md-9">
          <h1 className="text-center">All Orders</h1>

          {orders?.map((o, i) => {
            const orderKey = o?._id || i;
            const rowPopupClass = `order-dropdown-${orderKey}`;

            return (
              <div
                className="border shadow p-2"
                key={orderKey}
                data-test="order-card"
                data-order-id={o?._id}
              >
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Status</th>
                      <th scope="col">Buyer</th>
                      <th scope="col">Date</th>
                      <th scope="col">Payment</th>
                      <th scope="col">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr data-test="order-row">
                      <td>{i + 1}</td>
                      <td>
                        <div data-test="status-cell">
                          <Select
                            aria-label="Status"
                            data-test="order-status"
                            getPopupContainer={(trigger) => trigger.parentElement}
                            popupClassName={rowPopupClass}
                            dropdownMatchSelectWidth={false}
                            bordered={false}
                            defaultValue={o?.status}
                            onChange={(value) => handleChange(o?._id, value)}
                          >
                            {status.map((s, idx) => (
                              <Option key={idx} value={s}>
                                {s}
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </td>
                      <td>{o?.buyer?.name || "—"}</td>
                      <td>
                        {o?.createdAt
                          ? moment(o.createdAt).fromNow()
                          : o?.createAt
                          ? moment(o.createAt).fromNow()
                          : "—"}
                      </td>
                      <td>{o?.payment?.success ? "Success" : "Failed"}</td>
                      <td>{o?.products?.length ?? 0}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="container">
                  {o?.products?.map((p) => (
                    <div
                      className="row mb-2 p-3 card flex-row"
                      key={p?._id}
                      data-test="order-product"
                    >
                      <div className="col-md-4">
                        <img
                          src={`/api/v1/product/product-photo/${p?._id}`}
                          className="card-img-top"
                          alt={p?.name || "Product"}
                          width="100"
                          height="100"
                        />
                      </div>
                      <div className="col-md-8">
                        <p>{p?.name}</p>
                        <p>{(p?.description || "").substring(0, 30)}</p>
                        <p>Price : {p?.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!orders?.length && (
            <div className="text-muted" data-test="orders-empty">
              No orders found.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminOrders;
