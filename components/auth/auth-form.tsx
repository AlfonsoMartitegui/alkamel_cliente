import { Button, Form, Container, Row, Col } from "react-bootstrap";
import { loginForm } from "./login.module.css";
import { useState, useRef } from "react";
import React, { FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

async function createUser(email: string, pwd: string) {
  const response = await fetch("api/user/signup", {
    method: "POST",
    body: JSON.stringify({ email, pwd }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went grown");
  }

  return data;
}

interface AuthFormProps {
  onlogin: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onlogin }) => {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const [isLogin, setIsLogin] = useState(true);

  const router = useRouter();

  function switchAuthModeHandler(): void {
    setIsLogin((prevState) => !prevState);
  }

  async function submitHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const enteredEmail = emailInputRef.current?.value;
    const enteredPassword = passwordInputRef.current?.value;
    const enteredConfirmPassword = confirmPasswordInputRef.current?.value;

    // optional: Add validation
    if (!enteredEmail || !enteredPassword) {
      console.error(
        "Please enter both email and password."
      );
      alert("Please enter both email and password.");
      return;
    }

    if (!isLogin && enteredPassword !== enteredConfirmPassword) {
      console.error("The passwords don't match.");
      alert("The passwords don't match.");
      return;
    }

    if (isLogin) {
      const result = await signIn("credentials", {
        redirect: false,
        email: enteredEmail,
        password: enteredPassword,
      });

      console.log(result);

      if (!result?.error) {
        console.log("Login successful!");
        onlogin();
      }
      else {
        console.log("Login failed!");
        alert(`${result.error} \nStatus: ${result.status} \nPlease check your info and try again`);
      }
    } else {
      try {
        const result = await createUser(enteredEmail, enteredPassword);
        console.log(result);
      } catch (error) {
        console.log("Error: ", error);
      }
    }
  }

  return (
    <Container className={`my-auto ${loginForm}`}>
      <h1 className="text-white my-4 pt-3">
        {isLogin ? "LOGIN" : "CREATE ACCOUNT"}
      </h1>
      <Row>
        <Col>
          <form onSubmit={submitHandler}>
            <Form.Group className="mt-3 mb-3" controlId="formBasicEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                required
                ref={emailInputRef}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                required
                ref={passwordInputRef}
              />
            </Form.Group>
            {router.query.error && (
              <Form.Group>
                <Row>
                  <Col className="bg-danger mx-2 p-2">{router.query.error}</Col>
                </Row>
              </Form.Group>
            )}
            {!isLogin && (
              <Form.Group className="p-3" controlId="formPasswordConfirm">
                <Form.Label>Repeat Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="PasswordConfirm"
                  ref={confirmPasswordInputRef}
                />
              </Form.Group>
            )}
            <Form.Group className="mt-4">
              <Row>
                <Col>
                  <Button variant="primary" type="submit">
                    {isLogin ? "Login" : "Create Account"}
                  </Button>
                </Col>
                <Col className="text-end">
                  <Button
                    variant="link"
                    type="button"
                    onClick={switchAuthModeHandler}
                  >
                    {isLogin
                      ? "Create new account"
                      : "Login with existing account"}
                  </Button>
                </Col>
              </Row>
            </Form.Group>
          </form>
        </Col>
      </Row>
    </Container>
  );
};

export default AuthForm;
