import React, { useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({ name: "", skills: "" });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    console.log("Profile saved:", profile);
    alert("Profile updated (dummy)");
  };

  return (
    <div>
      <h2>My Profile</h2>
      <input name="name" placeholder="Name" onChange={handleChange} />
      <input name="skills" placeholder="Skills" onChange={handleChange} />
      <button onClick={saveProfile}>Save</button>
    </div>
  );
}
