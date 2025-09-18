import { AuthProvider } from "./context/AuthContext";

export default function App({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
