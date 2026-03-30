import { useEffect, useState } from "react";
import { fetchMe } from "./api/api";

export default function Dashboard() {
  const [me, setMe] = useState<{ loggedIn: boolean; ghUser?: string } | null>(null);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  if (!me) return <div>Loading...</div>;
  if (!me.loggedIn) return <div>Not logged in</div>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Dashboard</h2>
      <p>Welcome, {me.ghUser} 🎉</p>
    </div>
  );
}
