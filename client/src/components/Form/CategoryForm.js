import React from "react";

const CategoryForm = ({ handleSubmit, value, setValue }) => {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <input
          id="categoryInput"
          type="text"
          className="form-control"
          placeholder="Enter new category"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          minLength="2"
          maxLength="50"
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
};

export default CategoryForm;