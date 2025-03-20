import React from "react";
import "./globals.css";
import Link from "next/link";
import router from "next/router";
import { SignoutButton } from "../components/SignoutButton/SignoutButton";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-gray-100 min-h-screen">
          <header className="bg-blue-600 text-white p-4 shadow-md">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <h1 className="text-2xl font-bold">Task Shelter</h1>
                <h2 className="text-sm italic">
                  Not a Financial Application - a Task App
                </h2>
              </div>
              <div className="col-span-1 flex justify-end">
                <SignoutButton />
              </div>
            </div>
          </header>
          <main className="container mx-auto p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
