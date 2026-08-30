import React from "react";

export default function Layout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-mist-800 min-h-screen p-2 flex flex-col gap-2 max-h-screen max-w-full">
      <div className="text-white flex justify-center items-center h-4">
        <div className="m-0 font-bold">{title}</div>
      </div>
      <div className="bg-mist-900 rounded-xl p-2 flex-1 min-h-0 flex">
        {children}
      </div>
    </div>
  );
}