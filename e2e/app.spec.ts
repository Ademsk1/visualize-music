import { test, expect } from '@playwright/test'

test.describe('app shell', () => {
  test('loads with title, skip link, main stage, and HUD', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/visualize-music/i)
    await expect(
      page.getByRole('link', { name: /skip to visualization/i })
    ).toBeVisible()
    await expect(page.locator('#main-stage')).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Player controls' })
    ).toBeVisible()
  })
})

test.describe('help dialog', () => {
  test('opens on first visit with overview content', async ({ page }) => {
    await page.goto('/')
    const dialog = page.getByRole('dialog', { name: 'About visualize-music' })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: 'What it is' })
    ).toBeVisible()
    await expect(
      dialog.getByRole('heading', { name: 'How it works' })
    ).toBeVisible()
  })

  test('dismisses with OK and stays closed after reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })

  test('reopens from the help button in the bar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'OK' }).click()
    await page
      .getByRole('button', {
        name: /open help: overview and how the controls work/i,
      })
      .click()
    await expect(
      page.getByRole('dialog', { name: 'About visualize-music' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('primary action', () => {
  test('exposes Start listening when the engine is ready', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'OK' }).click()
    const start = page.getByRole('button', { name: /start listening/i })
    await expect(start).toBeVisible()
    await expect(start).toBeEnabled({ timeout: 30_000 })
  })
})
