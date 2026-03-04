import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';

import { HomePage } from './components/HomePage.jsx';
import { LoginForm, TotpForm } from './components/LoginForm.jsx';
import { OrderList } from './components/OrderList.jsx';
import { API } from './API.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';


// Navbar component with navigation and login/logout
function MyNavbar(props) {
  const navigate = useNavigate();
  const name = props.user && props.user.name;

  return (
    <>
      <Navbar className="shadow" fixed="top" bg="light" style={{ marginBottom: "2rem" }}>
        <Container>
          <Navbar.Brand href="/" onClick={event => { event.preventDefault(); navigate("/"); }}>
            <i className="bi bi-cloud-fill" />
            {" "}
            Cloud Services
          </Navbar.Brand>
          <Nav>
            {name ? (
              <Navbar.Text>
                <Nav.Link
                  href="/orders"
                  active={false}
                  onClick={event => { event.preventDefault(); navigate("/orders"); }}
                  style={{ display: 'inline', padding: '0 0.5rem' }}
                >
                  <i className="bi bi-box-seam"></i> My Orders
                </Nav.Link>
                {" | "}
                Logged in as: {name} | <a href="/logout" onClick={event => { event.preventDefault(); props.logout(); }}>Logout</a>
              </Navbar.Text>
            ) : (
              <Nav.Link href="/login" active={false} onClick={event => { event.preventDefault(); navigate("/login"); }}>
                Login
                {" "}
                <i className="bi bi-person-fill" />
              </Nav.Link>
            )}
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

// Wrapper component to handle login with navigation
function LoginWrapper({ onLogin }) {
  const navigate = useNavigate();

  const handleLoginWithRedirect = async (credentials) => {
    const user = await onLogin(credentials);
    // After successful login, check if user can do TOTP
    if (user && user.canDoTotp) {
      // Redirect to TOTP page
      navigate('/login-totp');
    } else {
      // Otherwise redirect to home
      navigate('/');
    }
  };

  return <LoginForm onLogin={handleLoginWithRedirect} />;
}

// Wrapper component to handle TOTP authentication with navigation
function TotpWrapper({ onLoginTotp }) {
  const navigate = useNavigate();

  const handleTotpWithRedirect = async (code, onFinish) => {
    try {
      await onLoginTotp(code);
      // After successful TOTP, redirect to home
      navigate('/');
    } catch (err) {
      // Error will be handled by TotpForm
      throw err;
    } finally {
      // Call the onFinish callback to reset waiting state
      if (onFinish) onFinish();
    }
  };

  return <TotpForm loginTotpCbk={handleTotpWithRedirect} errorAlertActive={false} />;
}

/**
 * Informs the user that the route is not valid
 */
function NotFoundPage() {
  return <>
    <div style={{"textAlign": "center", "paddingTop": "5rem"}}>
      <h1>
        <i className="bi bi-exclamation-circle-fill"/>
        {" "}
        The page cannot be found
        {" "}
        <i className="bi bi-exclamation-circle-fill"/>
      </h1>
      <br/>
      <p>
        The requested page does not exist, please head back to the <Link to={"/"}>app</Link>.
      </p>
    </div>
  </>;
}

function App() {
  // State to store the logged-in user (null if not logged in)
  const [user, setUser] = useState(null);

  // State to show initial loading while checking if user is already logged in
  const [loading, setLoading] = useState(true);

  // Effect that runs ONLY ONCE when the app loads
  // Checks if the user is already logged in (has an active session)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Ask the server: "Is there a logged-in user?"
        const currentUser = await API.fetchCurrentUser();
        // If the call succeeds, save the user in state
        setUser(currentUser);
      } catch (err) {
        // If the call fails (401), it means no one is logged in
        // IMPORTANT: Only set to null on initial load (when user is still null)
        // Don't clear user if we already have one (prevents clearing after login)
        setUser(prevUser => prevUser || null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // [] means: run this effect only when the component mounts

  /**
   * Function called when the user logs in and it calls API.login
   * @param {Object} credentials - { email, password }
   * @returns {Object} user object with canDoTotp and isTotp flags
   */
  const handleLogin = async (credentials) => {
    // Call the login API with email and password
    const user = await API.login(credentials.email, credentials.password);
    // If login succeeds, save the user in state
    setUser(user);
    // Return the user so Login component can check canDoTotp
    return user;
    // Note: if login fails, the error will be thrown and caught by the Login component
  };

  /**
   * Function called when the user completes TOTP authentication
   * @param {string} code - 6-digit TOTP code
   */
  const handleLoginTotp = async (code) => {
    // Call the TOTP API
    await API.loginTotp(code);
    // Update the user state to reflect TOTP completion
    // We need to fetch the updated user info to get isTotp: true
    const updatedUser = await API.fetchCurrentUser();
    setUser(updatedUser);
    // Note: if TOTP fails, the error will be thrown and caught by the TotpForm component
  };

  /**
   * Function called when the user logs out
   */
  const handleLogout = async () => {
    try {
      // Call the logout API
      await API.logout();
      // Reset the user state to null
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // If we're still checking authentication, show a loading screen
  if (loading) {
    return (
      <Container className="text-center mt-5">
        <h3>Loading...</h3>
      </Container>
    );
  }



  return (
    <>
      {/* Navbar always visible with Login/Logout button */}
      <MyNavbar user={user} logout={handleLogout} />

      <Routes>
        {/* Main route: always show cloud services (for everyone) */}
        <Route
          path="/"
          element={
            <Container fluid style={{ paddingTop: '80px' }}>
              <HomePage user={user} />
            </Container>

          }
        />

        {/* Login route: only accessible if not logged in */}
        <Route
          path="/login"
          element={
            user ? (
              // If already logged in, redirect to home or TOTP page if needed
              user.canDoTotp && !user.isTotp ? (
                <Navigate to="/login-totp" replace />
              ) : (
                <Navigate to="/" replace />
              )
            ) : (
              <LoginWrapper onLogin={handleLogin} />
            )
          }
        />

        {/* TOTP route: accessible only if logged in but not yet TOTP verified */}
        <Route
          path="/login-totp"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : user.isTotp ? (
              <Navigate to="/" replace />
            ) : (
              <TotpWrapper onLoginTotp={handleLoginTotp} />
            )
          }
        />

        {/* Orders route: only accessible if logged in */}
        <Route
          path="/orders"
          element={
            user ? (
              <div style={{ paddingTop: '90px' }}>
                <OrderList user={user} />
              </div>
            ) : (
              // If not logged in, redirect to login page
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;


