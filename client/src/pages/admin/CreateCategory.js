import React, { useEffect, useState } from "react";
import Layout from "./../../components/Layout";
import AdminMenu from "./../../components/AdminMenu";
import toast from "react-hot-toast";
import axios from "axios";
import CategoryForm from "../../components/Form/CategoryForm";
import { Modal } from "antd";
const CreateCategory = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [updatedName, setUpdatedName] = useState("");
  // Handle category creation form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation to match HTML5 constraints
    if (!name || name.trim().length === 0) {
      toast.error("Category name is required");
      return;
    }
    
    if (name.trim().length < 2) {
      toast.error("Category name must be at least 2 characters long");
      return;
    }
    
    if (name.trim().length > 50) {
      toast.error("Category name must not exceed 50 characters");
      return;
    }
    
    try {
      const { data } = await axios.post("/api/v1/category/create-category", {
        name,
      });
      if (data?.success) {
        toast.success(`Category "${name}" created successfully`);
        setName("");
        getAllCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to create category. Please check your input and try again.");
    }
  };

  // Fetch all categories from the API
  const getAllCategories = async () => {
    try {
      const { data } = await axios.get("/api/v1/category/get-category");
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load categories. Please refresh the page and try again.");
    }
  };

  useEffect(() => {
    getAllCategories();
  }, []);

  // Handle category update submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Client-side validation to match HTML5 constraints
    if (!updatedName || updatedName.trim().length === 0) {
      toast.error("Category name is required");
      return;
    }
    
    if (updatedName.trim().length < 2) {
      toast.error("Category name must be at least 2 characters long");
      return;
    }
    
    if (updatedName.trim().length > 50) {
      toast.error("Category name must not exceed 50 characters");
      return;
    }
    
    try {
      const { data } = await axios.put(
        `/api/v1/category/update-category/${selected._id}`,
        { name: updatedName }
      );
      if (data.success) {
        toast.success(`Category "${updatedName}" updated successfully`);
        setSelected(null);
        setUpdatedName("");
        setVisible(false);
        getAllCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update category. Please try again.");
    }
  };
  // Handle category deletion
  const handleDelete = async (categoryId) => {
    try {
      const { data } = await axios.delete(
        `/api/v1/category/delete-category/${categoryId}`
      );
      if (data.success) {
        toast.success("Category deleted successfully");

        getAllCategories();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to delete category. Please try again.");
    }
  };
  return (
    <Layout title={"Dashboard - Create Category"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>Manage Category</h1>
            <div className="p-3 w-50">
              <CategoryForm
                handleSubmit={handleSubmit}
                value={name}
                setValue={setName}
              />
            </div>
            <div className="w-75">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories?.map((c) => (
                      <tr key={c._id}>
                        <td>{c.name}</td>
                        <td>
                          <button
                            className="btn btn-primary ms-2"
                            onClick={() => {
                              setVisible(true);
                              setUpdatedName(c.name);
                              setSelected(c);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger ms-2"
                            onClick={() => {
                              handleDelete(c._id);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Modal
              onCancel={() => setVisible(false)}
              footer={null}
              open={visible}
              title="Update Category"
            >
              <CategoryForm
                value={updatedName}
                setValue={setUpdatedName}
                handleSubmit={handleUpdate}
              />
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateCategory;