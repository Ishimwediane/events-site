import { redirect } from "next/navigation";

/** The old /admin area moved into the dashboard; keep old bookmarks working. */
export default function OldAdmin() {
  redirect("/dashboard/admin");
}
