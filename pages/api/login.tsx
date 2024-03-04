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
    getSession().then(async (session) => {
      if (session) {
        if (session.userProfile.roleid === 1 && isLoggedIn) {
          setIsRedirecting(true);

          const fetchEvents = async () => {
            try {
              const response = await fetch("/api/events/getLatestEvent", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  promoterid: session.userProfile.promoterid,
                }),
              });

              if (!response.ok) {
                throw new Error(
                  `Error fetching data. HTTP status: ${response.status}`
                );
              }

              const data = await response.json();
              return data;
            } catch (error) {
              console.error("Error fetching data:", error);
              return "";
            }
          };

          const latestEvent = await fetchEvents();
          console.log("REDIRIGIENDO A LA PÁGINA DEL EVENTO", latestEvent);
          // Redirigir a la página del evento
          router.replace("/" + "events" + "/" + latestEvent);
        }
        if (session.userProfile.roleid === 2 && isLoggedIn) {
          setIsRedirecting(true);

          const fetchEvents = async () => {
            try {
              const response = await fetch("/api/events/getLatestEvent", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  promoterid: session.userProfile.promoterid,
                }),
              });

              if (!response.ok) {
                throw new Error(
                  `Error fetching data. HTTP status: ${response.status}`
                );
              }

              const data = await response.json();
              return data;
            } catch (error) {
              console.error("Error fetching data:", error);
              return "";
            }
          };

          const latestEvent = await fetchEvents();
          console.log("REDIRIGIENDO A LA PÁGINA DEL EVENTO", latestEvent);
          // Redirigir a la página del evento
          router.replace("/" + "events" + "/" + latestEvent);
        } else {
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

  if (isRedirecting) {
    return <p>Redirecting...</p>;
  }

  return <AuthForm onlogin={onlogin} />;
};

export default Login;
