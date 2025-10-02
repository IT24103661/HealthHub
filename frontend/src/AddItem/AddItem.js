import React, { useState } from "react";
import axios from "axios";

function AddItemForm() {
  const [formData, setFormData] = useState({
    itemid: "",
    itemName: "",
    itemImage: null,
    itemQty: "",
    itemCategory: "",
    itemDetails: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "itemImage") {
      setFormData({ ...formData, itemImage: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageName = "";

    if (formData.itemImage) {
      const uploadData = new FormData();
      uploadData.append("file", formData.itemImage);

      try {
        const response = await axios.post(
          "http://localhost:8080/inventry/itemImg",
          uploadData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        imageName = response.data;
      } catch (error) {
        console.error("Error uploading image:", error);
        return;
      }
    }

    const updatedItem = { ...formData, itemImage: imageName };

    try {
      await axios.post("http://localhost:8080/inventry", updatedItem);
      alert("Item added successfully");
      window.location.href = "/";
    } catch (err) {
      console.error("Error saving item:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Add New Item</h2>

      <label>Item ID:
        <input type="text" name="itemid" value={formData.itemid} onChange={handleChange} style={styles.input} />
      </label>

      <label>Name:
        <input type="text" name="itemName" value={formData.itemName} onChange={handleChange} style={styles.input} />
      </label>

      <label>Category:
        <input type="text" name="itemCategory" value={formData.itemCategory} onChange={handleChange} style={styles.input} />
      </label>

      <label>Quantity:
        <input type="number" name="itemQty" value={formData.itemQty} onChange={handleChange} style={styles.input} />
      </label>

      <label>Image:
        <input type="file" name="itemImage" onChange={handleChange} style={styles.input} />
      </label>

      <label>Description:
        <textarea name="itemDetails" value={formData.itemDetails} onChange={handleChange} style={styles.textarea} />
      </label>

      <button type="submit" style={styles.button}>Send data to backend</button>
    </form>
  );
}

const styles = {
  form: { maxWidth: "500px", margin: "0 auto", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px" },
  input: { width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
  textarea: { width: "100%", height: "100px", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" },
  button: { padding: "0.75rem 1.5rem", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }
};

export default AddItemForm;
//comment