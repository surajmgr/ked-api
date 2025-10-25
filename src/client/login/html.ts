import { AuthSessionResponseSchema } from "@/schema/auth.schema";
import { env } from "cloudflare:workers";

export function getLoginHtml(session: AuthSessionResponseSchema) {
  const loggedIn = !!session?.user;
  const AUTH_API_URL = env.AUTH_API_URL;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${loggedIn ? 'Dashboard' : 'Login'}</title>
</head>
<body>
  ${loggedIn ? `
    <p>Welcome, ${session?.user?.email || 'User'}!</p>
    <button id="logoutBtn">Logout</button>
  ` : `
    <form id="loginForm">
      <input type="email" name="email" placeholder="Email" required /><br />
      <input type="password" name="password" placeholder="Password" required /><br />
      <button type="submit">Login</button>
    </form>
  `}

  <script>
    ${!loggedIn ? `
    (function() {
      const form = document.getElementById('loginForm');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = form.email.value.trim();
        const password = form.password.value;

        if (!email || !password) {
          alert('Please fill in both fields.');
          return;
        }

        try {
          const res = await fetch('${AUTH_API_URL}/api/auth/sign-in/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Login failed');
          }

          const result = await res.json();
          alert('Logged in successfully!');
          if (result?.redirectUrl) window.location.href = result.redirectUrl;
          else window.location.reload();
        } catch (err) {
          alert(err.message || 'Login error');
        }
      });
    })();
    ` : `
    (function() {
      const logoutBtn = document.getElementById('logoutBtn');
      logoutBtn.addEventListener('click', async () => {
        try {
          const res = await fetch('${AUTH_API_URL}/api/auth/sign-out', {
            method: 'POST',
            credentials: 'include'
          });
          if (!res.ok) throw new Error('Logout failed');
          window.location.reload();
        } catch (err) {
          alert(err.message || 'Logout error');
        }
      });
    })();
    `}
  </script>
</body>
</html>
`;
}
