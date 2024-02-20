import { Button } from "react-bootstrap";
import Link from "next/link";
import React from "react";
import { Navbar, Nav, Container, Row, Col } from "react-bootstrap";
import Clock from "react-live-clock";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";

// interface mainNavigationProps {
//   timeZone: string;
// }

const MainNavigation: React.FC<{ timeZone: string }> = ({ timeZone }) => {
  const session = useSession();
  const router = useRouter();
  //const { data: session, status } = useSession();
  console.log("SESSION??? ", session);
  //console.log(router.asPath, "BASE:", router.basePath, "?", router.query);
  //console.log("router: ", router);
  //console.log("IS_VIEWER_MODE:", process.env.NEXT_PUBLIC_IS_VIEWER_MODE);

  const getBasePath = (path: string) => {
    if (path.length > 8) {
      const cleanPath = path.substring(8);
      console.log("PAth:", path, "Clean:", cleanPath);
      const idx = cleanPath.lastIndexOf("/");
      if (idx >= 0) {
        console.log("FINAL:", "events/" + cleanPath.substring(0, idx));
        return "events/" + cleanPath.substring(0, idx);
      } else {
        console.log("FINAL 2:", path);
        return path;
      }
    } else return path;
  };

  if (process.env.NEXT_PUBLIC_IS_VIEWER_MODE === "1") {
    return (
      <header className="mb-0">
        <Navbar
          style={{ backgroundColor: "#d02020" }}
          variant="dark"
          className="my-0 py-0"
          expand="sm"
        >
          <Container fluid>
            <Navbar.Brand className="pb-0">
              <Row>
                <Col className="col-auto my-1 py-0">
                  <Image
                    src="/ppTrackerLogoV0.png"
                    alt="PP-Tracker"
                    height={43}
                    width={250}
                    className="my-0 py-0"
                  />
                </Col>
                <Col className="fs-2 fw-bolder text-center text-white">
                  <Clock
                    format={"HH:mm:ss"}
                    ticking={true}
                    timezone={timeZone}
                  />
                </Col>
              </Row>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                {/*<Link href="/">
                <a className="nav-link active">Home</a>
  </Link>*/}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    );
  } else {
    return (
      <header className="mb-1">
        <Navbar
          style={{ backgroundColor: "#d02020" }}
          variant="dark"
          className="my-0 py-0"
          expand="sm"
        >
          <Container fluid>
            <Navbar.Brand className="pb-0">
              <Row>
                <Col className="col-auto py-0">
                  <Image
                    src="/ppTrackerLogoV0.png"
                    alt="PP-Tracker"
                    height={53}
                    width={250}
                    className="my-0"
                  />
                </Col>
                <Col className="fs-2 fw-bolder text-center text-white">
                  <Clock
                    format={"HH:mm:ss"}
                    ticking={true}
                    timezone={timeZone}
                  />
                </Col>
              </Row>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                {/*<Link href="/">
                  <a className="nav-link active">Home</a>
    </Link>*/}
                {session.status === "authenticated" && (
                  <Link href="/user">
                    <a className="nav-link disabled">
                      {session.data.user?.name}
                    </a>
                  </Link>
                )}
                {session.status === "authenticated" &&
                  router.asPath.startsWith("/events/") && (
                    <Link href={"/" + getBasePath(router.asPath)}>
                      <a className="nav-link fw-bold">Tracking</a>
                    </Link>
                  )}
                {session.status === "authenticated" &&
                  router.asPath.startsWith("/events/") && (
                    <Link href={"/" + getBasePath(router.asPath) + "/replay"}>
                      <a className="nav-link fw-bold">Replay</a>
                    </Link>
                  )}
                {session.status === "authenticated" &&
                  router.asPath.startsWith("/events/") && (
                    <Link href={"/" + getBasePath(router.asPath) + "/training"}>
                      <a className="nav-link fw-bold">Training Reports</a>
                    </Link>
                  )}
                {session.status === "authenticated" ? (
                  <Button
                    style={{ backgroundColor: "#d02020", border: "0px" }}
                    className="fw-bold btn-sm"
                    onClick={() => signOut()}
                  >
                    Logout
                  </Button>
                ) : (
                  <Link href="/login">
                    <a className="nav-link">Login</a>
                  </Link>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      </header>
    );
  }
};

export default MainNavigation;
