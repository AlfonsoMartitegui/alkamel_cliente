import AuthForm from "components/auth/auth-form";
import type { NextPage } from "next";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Login: NextPage = (props) => {
  
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const onlogin = () => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        if(session.userProfile.roleid === 1 && isLoggedIn){
          setIsRedirecting(true);
          router.replace("/" + "events" + "/" + "pozoblanco23");
        }
        if(session.userProfile.roleid === 2 && isLoggedIn){
          setIsRedirecting(true);
          router.replace("/" + "events" + "/" + "pozoblanco23");
        }
        else{
          setIsRedirecting(true);
          router.replace("/");
        }
      } else {
        setIsLoading(false);
        setIsRedirecting(false);
      }
    });
  }, [router, isLoggedIn]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if(isRedirecting){
    return <p>Redirecting...</p>;
  }

  return <AuthForm onlogin={onlogin}/>;
};

export default Login;