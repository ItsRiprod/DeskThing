require('dotenv').config()
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization: Not macOS platform')
    return
  }

  const appName = context.packager.appInfo.productFilename

  console.log('Starting notarization process...')

  try {
    const notarizePromise = notarize({
      tool: 'notarytool',
      teamId: process.env.APPLE_TEAM_ID,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD
    })

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Notarization timed out after 5 minutes')), 5 * 60 * 1000)
    })

    await Promise.race([notarizePromise, timeoutPromise])
    console.log('Notarization completed successfully')
  } catch (error) {
    console.error('Notarization failed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error(
      'Environment variables:',
      '\nAPPLE_TEAM_ID:',
      process.env.APPLE_TEAM_ID ? 'Set' : 'Not set',
      '\nAPPLE_ID:',
      process.env.APPLE_ID ? 'Set' : 'Not set',
      'APPLE_APP_SPECIFIC_PASSWORD:',
      process.env.APPLE_APP_SPECIFIC_PASSWORD ? 'Set' : 'Not set'
    )
    console.error('App path:', `${appOutDir}/${appName}.app`)
  }
}
