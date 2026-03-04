import { useState } from 'react';

import { Form, Button, Card, Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import validator from 'validator';
import 'bootstrap-icons/font/bootstrap-icons.css';


/**
 *  * The TOTP authentication page displayed on "/login"totp" route
 * 
 * @param props.loginTotpCbk callback to perform the actual TOTP authentication
 * @param props.errorAlertActive true when the error alert on the top is active and showing, false otherwise
 */
function TotpForm(props) {
  const [totpCode, setTotpCode] = useState('');

  const [codeError, setCodeError] = useState("");
  const [waiting, setWaiting] = useState(false);

  const handleSubmit = event => {
    event.preventDefault();

    // Validate form
    const trimmedCode = totpCode.trim();
    const codeError = validator.isEmpty(trimmedCode) ? "Code must not be empty" : (
      trimmedCode.length != 6 ? "Code must be 6 characters" : ""
    );

    if (!codeError) {
      setWaiting(true);
      props.loginTotpCbk(totpCode, () => { setWaiting(false); setTotpCode("");} );
    } else {
      setCodeError(codeError);
    }
  };
   return (
    <Container fluid style={{"marginTop": props.errorAlertActive ? "2rem" : "6rem"}}>
    <Row className="justify-content-evenly">
    <Col style={{"paddingLeft": "3rem"}}>
      <Link to="/"><i className="bi bi-arrow-left"/>back</Link>
    </Col>
    <Col style={{"maxWidth": "50rem", "minWidth": "30rem"}}>
    <Card>
      <Card.Header as="h2">Second Factor Authentication</Card.Header>
      <Container style={{"marginTop": "0.5rem", "padding": "1rem"}}>
        <Form noValidate onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Form.Group as={Col}>
              <Form.Label>Code from your device</Form.Label>
              <Form.Control isInvalid={!!codeError}
                            type="text"
                            placeholder="nnnnnn"
                            value={totpCode}
                            autoFocus
                            onChange={event => {setTotpCode(event.target.value); setCodeError("");}}/>
              <Form.Control.Feedback type="invalid">
                {codeError}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>
          <Button type="submit" disabled={waiting}>
            {
              waiting ? 
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                  {" "}
                </>
              : false
            }
            Validate 
          </Button>
          <Link to='/'><Button className='mx-2' variant='secondary'>Skip</Button></Link>
        </Form>
      </Container>
    </Card>
    </Col>
    <Col/>
    </Row>
    </Container>
    )
   
}

/**
 * The login page displayed on "/login"
 * 
 * @param props.loginCbk callback to perform the actual login
 * @param props.errorAlertActive true when the error alert on the top is active and showing, false otherwise
 */
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [passwordValid, setPasswordValid] = useState(true);

  const [waiting, setWaiting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEmailError('');
    setPasswordValid(true);

    const credentials = { email, password };

    // Basic validation: check if fields are not empty
    if (email.trim() === '') {
      setEmailError('Email must not be empty');
      return;
    }
    if (password.trim() === '') {
      setPasswordValid(false);
      return;
    }

    // Set waiting to true before calling onLogin
    setWaiting(true);
    try {
      // Call onLogin and wait for it to complete
      await onLogin(credentials);
    } catch (err) {
      // If login fails, show the error message
      const errorMsg = Array.isArray(err) ? err.join(', ') : 'Login failed';
      setEmailError(errorMsg);
    } finally {
      // Always set waiting to false when done
      setWaiting(false);
    }
  };

  return (
    <Container fluid style={{ marginTop: "6rem" }}>
      <Row className="justify-content-evenly">
        <Col style={{ paddingLeft: "3rem" }}>
          <Link to="/"><i className="bi bi-arrow-left" /> back</Link>
        </Col>
        <Col style={{ maxWidth: "50rem", minWidth: "30rem" }}>
          <Card>
            <Card.Header as="h2">Login</Card.Header>
            <Container style={{ marginTop: "0.5rem", padding: "1rem" }}>
              <Form noValidate onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Form.Group as={Col}>
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      isInvalid={!!emailError}
                      type="email"
                      placeholder="mail@provider.com"
                      value={email}
                      autoFocus
                      onChange={event => { setEmail(event.target.value); setEmailError(""); }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {emailError}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col}>
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      isInvalid={!passwordValid}
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={event => { setPassword(event.target.value); setPasswordValid(true); }}
                    />
                    <Form.Control.Feedback type="invalid">
                      Password must not be empty
                    </Form.Control.Feedback>
                  </Form.Group>
                </Row>
                <Button type="submit" disabled={waiting}>
                  {
                    waiting ?
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        {" "}
                      </>
                      : false
                  }
                  Login
                </Button>
              </Form>
            </Container>
          </Card>
        </Col>
        <Col />
      </Row>
    </Container>
  );
}

export { LoginForm, TotpForm };

