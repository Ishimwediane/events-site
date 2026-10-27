import { redirect } from "next/navigation";

/** Accounts are created by Ozone Events; there is no self sign-up. */
export default function RegisterPage() {
  redirect("/login");
}
