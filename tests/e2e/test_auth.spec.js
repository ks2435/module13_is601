const { test, expect } = require("@playwright/test");

function uniqueEmail() {
  return `e2e_${Date.now()}_${Math.floor(Math.random() * 1e5)}@example.com`;
}

test.describe("Register page", () => {
  test("positive: register with valid data shows success", async ({ page }) => {
    await page.goto("/static/register.html");
    const email = uniqueEmail();
    await page.fill("#username", `user_${Date.now()}`);
    await page.fill("#email", email);
    await page.fill("#password", "supersecret1");
    await page.fill("#confirm", "supersecret1");
    await page.click("#submit");

    const msg = page.locator("#message");
    await expect(msg).toBeVisible();
    await expect(msg).toHaveClass(/success/);
    await expect(msg).toContainText(/registered/i);

    const token = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(token).not.toBeNull();
    expect(token.length).toBeGreaterThan(10);
  });

  test("negative: short password shows client-side error and no call", async ({ page }) => {
    await page.goto("/static/register.html");
    let apiCalled = false;
    page.on("request", (req) => {
      if (req.url().endsWith("/register")) apiCalled = true;
    });

    await page.fill("#username", "shorty");
    await page.fill("#email", uniqueEmail());
    await page.fill("#password", "abc");
    await page.fill("#confirm", "abc");
    await page.click("#submit");

    const msg = page.locator("#message");
    await expect(msg).toBeVisible();
    await expect(msg).toHaveClass(/error/);
    await expect(msg).toContainText(/at least 8/i);
    expect(apiCalled).toBe(false);
  });
});

test.describe("Login page", () => {
  test("positive: login with correct credentials stores token", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "supersecret1";
    const username = `user_${Date.now()}`;
    const res = await request.post("/register", {
      data: { username, email, password },
    });
    expect(res.status()).toBe(201);

    await page.goto("/static/login.html");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click("#submit");

    const msg = page.locator("#message");
    await expect(msg).toBeVisible();
    await expect(msg).toHaveClass(/success/);
    await expect(msg).toContainText(/logged in/i);

    const token = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(token).not.toBeNull();
  });

  test("negative: wrong password shows invalid credentials", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "supersecret1";
    const username = `user_${Date.now()}`;
    await request.post("/register", { data: { username, email, password } });

    await page.goto("/static/login.html");
    await page.fill("#email", email);
    await page.fill("#password", "WRONG-pw-1");
    await page.click("#submit");

    const msg = page.locator("#message");
    await expect(msg).toBeVisible();
    await expect(msg).toHaveClass(/error/);
    await expect(msg).toContainText(/invalid credentials/i);
  });
});