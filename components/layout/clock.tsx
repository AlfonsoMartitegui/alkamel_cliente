import React, { useState, useEffect } from "react";

const Clock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(getCurrentTime());

    const intervalId = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  function getCurrentTime(): string {
    const now = new Date();
    const utcString = now.toISOString();
    const localTime = new Date(utcString);
    const hours = localTime.getHours().toString().padStart(2, "0");
    const minutes = localTime.getMinutes().toString().padStart(2, "0");
    const seconds = localTime.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  return (
    <>{currentTime}</>
  );
};

export default Clock;
