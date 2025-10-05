import React from "react";

const CategoryForm = ({ handleSubmit, value, setValue }) => {
  const handleBlur = (e) => {
    // Trim leading and trailing whitespace when user finishes editing
    const trimmedValue = value.trim();
    if (trimmedValue !== value) {
      setValue(trimmedValue);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Prevent submission of pure whitespace
    if (!value || value.trim().length === 0) {
      return;
    }
    handleSubmit(e);
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="mb-3">
        <input
          id="categoryInput"
          type="text"
          className="form-control"
          placeholder="Enter new category"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
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