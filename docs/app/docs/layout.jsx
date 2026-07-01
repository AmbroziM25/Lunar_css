import Sidebar from "../../components/Sidebar";

export default function DocsLayout({ children }) {
  return (
    <div className="docs-shell">
      <Sidebar />
      <article className="docs-prose min-h-screen">{children}</article>
    </div>
  );
}
