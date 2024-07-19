import { test, expect, type Cookie } from '@playwright/test'

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


test('create app via branch or commit', async ({ page, context }) => {
  await context.addCookies([
    { name: 'sage_username', value: user, ...cookieConfig },
    { name: 'sage_token', value: token, ...cookieConfig },
  ])

  await page.goto(`${url}/apps/my-apps`)

  const createAppBtn = page.getByText('Create app')
  await createAppBtn.click()
  await expect(page).toHaveTitle(/SAGE - Create App/)

  // fill in repo and verify config
  const repoInput = page.getByLabel(/GitHub Repo URL/)
  await repoInput.fill('https://github.com/waggle-sensor/plugin-helloworld-ml')
  await page.getByText('Verify').click()

  const appConfig = page.locator(':has-text("App Config") + pre.code')
  await expect(appConfig).toHaveText(`
    name: helloworld-ml
    namespace: devuser
    version: "1.0"
    description: my hello world app
    source:
      architectures:
        - linux/amd64
        - linux/arm/v7
        - linux/arm64
      url: https://github.com/waggle-sensor/plugin-helloworld-ml
      branch: master
    arguments:
      - speed
      - "5"
    inputs:
      - id: speed
        type: int
    metadata:
      my-science-data: 12345
  `)

  // upload should fail
  await page.getByText('Register App').click()
  await expect(page.getByText('Upload to S3 failed')).toBeVisible()


  // now fetch config for specific commit instead
  const commitHash = '7adcbccc4a6f294badba217e3d6a2f56475ac1f5'
  const gitCommit = page.getByLabel(/Commit Hash/)
  await gitCommit.fill(commitHash)

  await expect(appConfig).toHaveText(`
    name: helloworld-ml
    namespace: devuser
    version: "1.0"
    description: my hello world app
    source:
      architectures:
        - linux/amd64
        - linux/arm/v7
        - linux/arm64
      url: https://github.com/waggle-sensor/plugin-helloworld-ml
      git_commit: ${commitHash}
    arguments:
      - speed
      - "5"
    inputs:
      - id: speed
        type: int
    metadata:
      my-science-data: 12345
  `)

  // registration should fail since git_commit support isn't deployed
  await page.getByText('Register App').click()
  await expect(page.getByText('Neither tag nor branch specified')).toBeVisible()
})
