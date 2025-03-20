"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";

export function SignoutButton() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    // LAME: due to time constraints we're gonna do this.
    // don't do this. The native browser storage event listener
    // is not working.
    interval = setInterval(() => {
      setIsLoggedIn(!!localStorage.getItem("user"));
    }, 500);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    router.push("/");
  };

  return (
    <>
      {isLoggedIn && (
        <Link href="/" onClick={handleSignOut}>
          Sign Out
        </Link>
      )}
    </>
  );
}
