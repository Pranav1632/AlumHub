import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Welcome to AlumniHub</h1>
      <Link to="/signup">Signup</Link> | <Link to="/login">Login</Link>
    </div>
  );
}
