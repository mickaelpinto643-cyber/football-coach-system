import React from "react";

function StatCard({ title, value, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e9ef",
        borderRadius: "16px",
        padding: "22px"
      }}
    >
      <div style={{ fontSize: "25px" }}>
        {icon}
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: 900,
          color: "#09233d",
          marginTop: "10px"
        }}
      >
        {value}
      </div>

      <div
        style={{
          color: "#6b7a8c",
          marginTop: "4px"
        }}
      >
        {title}
      </div>
    </div>
  );
}

export default StatCard;
