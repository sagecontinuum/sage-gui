import { test, expect, type Cookie } from '@playwright/test'
import ecrApps from '../../ecr-apps.json'

const user = process.env.SAGE_UI_USER
const token = process.env.SAGE_UI_TOKEN

if (!user) {
  throw Error('username not provided; missing SAGE_UI_USER env var')
}

if (!token) {
  throw Error('token not provided; missing SAGE_UI_TOKEN env var')
}

const url = 'http://localhost:3000'


const cookieConfig = {
  domain: url.includes('https://portal.sagecontinuum.org') ? '.sagecontinuum.org' : 'localhost',
  path: '/',
  secure: true,
  sameSite: 'Strict' as Cookie['sameSite']
}

for (const app of ecrApps.reverse()) {
  const [commitHash, time, repo] = app

  test(`creating app ${repo}:${commitHash} (submitted ${time})`, async ({ page, context }) => {
    await context.addCookies([
      { name: 'sage_username', value: user, ...cookieConfig },
      { name: 'sage_token', value: token, ...cookieConfig },
    ])

    await page.goto(`${url}/apps/create-app`)

    // fill in repo and verify config
    const repoInput = page.getByLabel(/GitHub Repo URL/)
    await repoInput.fill(repo)
    await page.getByText('Verify').click()

    const appConfig = page.locator(':has-text("App Config") + pre.code')
    await expect(appConfig).toContainText(`branch: main`)


    // now fetch config for specific commit instead
    const gitCommit = page.getByLabel(/Commit Hash/)
    await gitCommit.fill(commitHash)

    await expect(appConfig).toContainText(`git_commit: ${commitHash}`)

    // registration should fail since git_commit support isn't deployed
    await page.getByText('Register App').click()
    await expect(page.getByText('Neither tag nor branch specified')).toBeVisible()
  })
}
