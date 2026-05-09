import { expect, test } from "@playwright/test";

test("creates a vault and adds a calendar event", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();
  await expect(page.getByText(/commit [a-f0-9]+/)).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/co-parent-vault"
  );
  await expect(page.getByRole("link", { name: /paypal/i })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita"
  );

  await page.getByPlaceholder("Rivera family").fill("Rivera family");
  await page.getByPlaceholder("Alex").fill("Alex");
  await page.getByPlaceholder("Jordan").fill("Jordan");
  await page.getByPlaceholder("Sam").fill("Sam");
  await page.locator('input[name="passphrase"]').fill("correct horse battery staple");
  await page.locator('input[name="confirm"]').fill("correct horse battery staple");
  await page.getByRole("button", { name: /create encrypted vault/i }).click();

  await expect(page.getByRole("heading", { name: "Rivera family" })).toBeVisible();
  await expect(page.getByText(/commit /)).toBeVisible();
  await expect(page.getByRole("link", { name: /github/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/co-parent-vault"
  );

  await page.getByRole("button", { name: "Calendar" }).click();
  await page.getByPlaceholder("Exchange, appointment, school meeting").fill("School conference");
  await page.getByRole("button", { name: /add event/i }).click();

  await expect(page.getByText("School conference")).toBeVisible();
});
