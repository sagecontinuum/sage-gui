import { test, expect } from '@playwright/test'

const url = 'http://localhost:3000/'

test('has title', async ({ page }) => {
  await page.goto(url)

  await expect(page).toHaveTitle(/SAGE/)
})

test('clicking tabs change title', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('tab', { name: 'All Nodes' }).click()
  await expect(page).toHaveTitle(/SAGE - All Nodes/)
  await page.getByRole('tab', { name: 'Sensors' }).click()
  await expect(page).toHaveTitle(/SAGE - Sensors/)
  await page.getByRole('tab', { name: 'Node Status' }).click()
  await expect(page).toHaveTitle(/SAGE - Nodes/)
})
