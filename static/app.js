// Shared helpers for register.html and login.html

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showMessage(el, type, text) {
  el.classList.remove("hidden", "success", "error");
  el.classList.add("message", type);
  el.textContent = text;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  return { status: res.status, data };
}

function storeToken(token) {
  localStorage.setItem("access_token", token);
}

function setupRegisterForm() {
  const form = document.getElementById("register-form");
  const msg = document.getElementById("message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.classList.add("hidden");

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    if (!username) {
      showMessage(msg, "error", "Username is required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      showMessage(msg, "error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      showMessage(msg, "error", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      showMessage(msg, "error", "Passwords do not match.");
      return;
    }

    const { status, data } = await postJSON("/register", { username, email, password });
    if (status === 201 && data && data.access_token) {
      storeToken(data.access_token);
      showMessage(msg, "success", "Registered! Token stored. You can now log in.");
      form.reset();
    } else {
      const detail = (data && data.detail) || "Registration failed.";
      showMessage(msg, "error", typeof detail === "string" ? detail : "Registration failed.");
    }
  });
}

function setupLoginForm() {
  const form = document.getElementById("login-form");
  const msg = document.getElementById("message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.classList.add("hidden");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!EMAIL_RE.test(email)) {
      showMessage(msg, "error", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      showMessage(msg, "error", "Password is required.");
      return;
    }

    const { status, data } = await postJSON("/login", { email, password });
    if (status === 200 && data && data.access_token) {
      storeToken(data.access_token);
      showMessage(msg, "success", "Logged in! Token stored.");
      form.reset();
    } else if (status === 401) {
      showMessage(msg, "error", "Invalid credentials.");
    } else {
      const detail = (data && data.detail) || "Login failed.";
      showMessage(msg, "error", typeof detail === "string" ? detail : "Login failed.");
    }
  });
}