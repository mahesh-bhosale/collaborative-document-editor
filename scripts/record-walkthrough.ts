import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

async function recordWalkthrough() {
  console.log('🎬 Starting Playwright Video Recording...')

  const videoDir = path.join(process.cwd(), 'public', 'recordings')
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true })
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
  })

  const page = await context.newPage()

  try {
    console.log('📍 1. Navigating to http://localhost:3000')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    // Handle authentication if on sign-in page
    if (page.url().includes('/sign-in')) {
      console.log('🔐 2. Signing in as Alice (alice@example.com)')
      await page.fill('#email', 'alice@example.com')
      await page.fill('#password', 'password123')
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle' })
      await page.waitForTimeout(1500)
    }

    console.log('📝 3. Creating document "DocFlow Master Plan"')
    const inputSelector = 'input[placeholder="Document title..."]'
    await page.waitForSelector(inputSelector)
    await page.fill(inputSelector, 'DocFlow Master Plan')
    await page.waitForTimeout(500)
    await page.click('button:has-text("Create")')
    await page.waitForNavigation({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    console.log('✏️ 4. Testing Inline Title Rename')
    const pencilBtn = page.locator('button[title="Rename document"]')
    if (await pencilBtn.isVisible()) {
      await pencilBtn.click()
      await page.waitForTimeout(500)
      const titleInput = page.locator('input[value="DocFlow Master Plan"]')
      await titleInput.fill('DocFlow Product Roadmap v2')
      await titleInput.press('Enter')
      await page.waitForTimeout(1500)
    }

    console.log('⌨️ 5. Testing Rich-Text Editor & Formatting Toolbar')
    const editorArea = page.locator('.ProseMirror')
    await editorArea.click()
    await editorArea.type('Welcome to DocFlow Collaborative Document Editor!\n')
    await page.waitForTimeout(500)

    // Type a heading
    await page.click('button[title="Heading 1 (Ctrl+Alt+1)"]')
    await editorArea.type('Core Platform Features\n')
    await page.waitForTimeout(500)

    // Type bold text
    await page.click('button[title="Bold (Ctrl+B)"]')
    await editorArea.type('Realtime Auto-Save: ')
    await page.click('button[title="Bold (Ctrl+B)"]')
    await editorArea.type('Saves state every 1.2 seconds directly to PostgreSQL.\n')
    await page.waitForTimeout(500)

    // Type bullet list
    await page.click('button[title="Bullet list"]')
    await editorArea.type('Fine-grained Viewer & Editor permissions\n')
    await editorArea.type('Markdown AST file import support (.txt & .md)\n')
    await page.waitForTimeout(2500) // Watch auto-save indicator transition to "Saved"

    console.log('🤝 6. Testing Document Sharing Modal')
    await page.click('button:has-text("Share")')
    await page.waitForTimeout(1000)
    await page.fill('#email', 'bob@example.com')
    await page.selectOption('select', 'EDITOR')
    await page.waitForTimeout(500)
    await page.click('button[type="submit"]:has-text("Share")')
    await page.waitForTimeout(1500)

    // Close share dialog
    await page.click('button[aria-label="Close"]')
    await page.waitForTimeout(1000)

    console.log('🏠 7. Navigating back to Dashboard')
    await page.click('text=Dashboard')
    await page.waitForTimeout(2000)

    console.log('🚪 8. Signing Out & Signing In as Bob (Shared User)')
    await page.click('text=Sign out')
    await page.waitForNavigation({ waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    await page.fill('#email', 'bob@example.com')
    await page.fill('#password', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    console.log('👁️ 9. Opening Shared Document as Bob')
    await page.click('text=DocFlow Product Roadmap v2')
    await page.waitForNavigation({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    console.log('✅ Recording completed successfully!')
  } catch (err) {
    console.error('Recording error:', err)
  } finally {
    // Close context to write out video file
    await page.close()
    await context.close()
    await browser.close()

    // Rename recorded file to public/docflow_demo.webm
    const files = fs.readdirSync(videoDir)
    const videoFile = files.find((f) => f.endsWith('.webm'))
    if (videoFile) {
      const srcPath = path.join(videoDir, videoFile)
      const destPath = path.join(process.cwd(), 'public', 'docflow_demo.webm')
      fs.copyFileSync(srcPath, destPath)
      console.log(`🎉 Video saved to: ${destPath}`)
    }
  }
}

recordWalkthrough()
