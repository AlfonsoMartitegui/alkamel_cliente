import React from "react";
import MainNavigation from "./main-navigation";

interface LayoutProps {
  timeZone: string;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <div className="bg-dark text-white">
      <MainNavigation timeZone={props.timeZone} />
      <main id="mainLayout">{props.children}</main>
    </div>
  );
};

export default Layout;
