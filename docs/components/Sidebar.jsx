"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav } from "./nav";

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="docs-sidebar">
      {docsNav.map((group) => (
        <div key={group.title} className="docs-sidebar-group">
          <div className="docs-sidebar-title">{group.title}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "is-active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  );
}
