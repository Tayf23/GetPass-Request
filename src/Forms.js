import React, { useState } from "react";

export default function SimpleForm() {
  const [form, setForm] = useState({ name: "", nationality: "", idNumber: "" });
  const [response, setResponse] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://127.0.0.1:8000/SimpleForm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          nationality: form.nationality,
          id_number: parseInt(form.idNumber, 10), // تحويل ID إلى رقم صحيح
        }),
      });

      const data = await res.json();
      setResponse(data.message || "تم إرسال البيانات بنجاح");
    } catch (error) {
      setResponse("خطأ في الاتصال بالسيرفر");
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "auto", padding: "20px", textAlign: "center" }}>
      <h2>Simple Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={50}
          />
        </div>
        <div>
          <label>Nationality:</label>
          <input
            type="text"
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            required
            minLength={3}
            maxLength={50}
          />
        </div>
        <div>
          <label>ID Number:</label>
          <input
            type="number"
            name="idNumber"
            value={form.idNumber}
            onChange={handleChange}
            required
            min="1"
          />
        </div>
        <button type="submit">Submit</button>
      </form>
      {response && <p>{response}</p>}
    </div>
  );
}
