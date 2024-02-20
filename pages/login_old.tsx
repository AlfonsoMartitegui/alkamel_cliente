import type { NextPage } from "next";
//import { FormEventHandler, Fragment } from "react";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
//import * as classes from "login.module.css";
import { loginForm } from "./login.module.css";
import { useState, useRef, useEffect } from "react";
//import { useRouter } from "next/router";
import React, { FormEvent } from "react";
import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
//import { getProviders } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

interface LogginProps {
  loggedIn: boolean;
}

const Login: NextPage<LogginProps> = (props) => {
  const router = useRouter();
  console.log("props:", props);

  useEffect(() => {
    if (props.loggedIn) {
      console.log("USER IS LOGGED IN.... NOW WHAT TO DO???");
      router.push("/promoter/1");
    }
  });

  const [isLogin, setIsLogin] = useState(true);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  //const router = useRouter();

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
  }

  function switchAuthModeHandler(): void {
    setIsLogin((prevState) => !prevState);
  }

  //async const handleFormEvent = (e: FormEvent<HTMLFormElement>) => {  // Do something };
  async function submitHandler(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const email = emailInputRef.current?.value;
    const password = passwordInputRef.current?.value;
    //const confirm = confirmPasswordInputRef.current?.value;

    //console.log("CREATING NEW USER???", email, password, confirm);

    // optional: Add validation

    if (isLogin) {
      console.log(
        ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SIGNING IN??????"
      );
      const response = await signIn("credentials", {
        username: email,
        password: password,
      });
      console.log("LOGIN RESPONSE????", response);
    } else {
      try {
        if (email && password) {
          const result = await createUser(email, password);
          console.log(result);
        }
      } catch (error) {
        console.log(error);
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
              <Form.Control type="password" required ref={passwordInputRef} />
            </Form.Group>
            {router.query.error && (
              <Form.Group>
                <Row>
                  <Col className="bg-danger mx-2 p-2">{router.query.error}</Col>
                </Row>
              </Form.Group>
            )}
            {!isLogin && (
              <Form.Group className="mb-3" controlId="formPasswordConfirm">
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

export default Login;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const session = await getSession({ req });
  //const providers = await getProviders();
  //console.log(providers);

  console.log(">>>>SESSION: ", session);
  return {
    props: {
      loggedIn: session ? true : false,
    },
  };
};
