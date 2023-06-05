import { test, expect } from '@playwright/test'

const url = 'https://portal.sagecontinuum.org'
const numOfRuns = 25


for (let i = 0; i < numOfRuns; i++) {
  test(`loads data browser #${i}`, async ({ page }) => {
    await page.goto(`${url}/query-browser`)

    const table = page.locator('table')
    await table.waitFor()
  })
}

for (let i = 0; i < 10; i++) {
  test(`loads node list #${i}`, async ({ page }) => {
    await page.goto(url)

    const table = page.locator('table')
    await table.waitFor()

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Sage/)

    // Expect the URL to redirect to nodes list
    await expect(page).toHaveURL(/.*nodes/)

    // Expect W023 to be there
    await expect(page.getByText('W023')).toBeVisible()
  })
}


test('nodes list has node W023', async ({ page }) => {
  await page.goto(url)

  await expect(page.getByText('W023')).toBeVisible()

  const table = page.locator('table')
  await table.waitFor()
})

test('W023 nodes page looks reasonable', async ({ page }) => {
  await page.goto(`${url}/node/W023`)

  await expect(page.getByText('Wild Sage Node W023 000048B02D15BC7C')).toBeVisible()
})