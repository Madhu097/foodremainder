import { ThemeProvider } from "../ThemeProvider";
import { Navbar } from "../Navbar";

export default function NavbarExample() {
  return (
    <ThemeProvider>
      <Navbar
        isAuthenticated={false}
        onLoginClick={() => console.log("Login clicked")}
        onRegisterClick={() => console.log("Register clicked")}
      />
    </ThemeProvider>
  );
}
