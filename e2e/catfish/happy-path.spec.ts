import { test, expect } from '@playwright/test';

/**
 * E2E Happy Path Test for Catfish Game
 * Tests the critical user flow from landing page to lobby
 *
 * Flow:
 * 1. Landing on Catfish game page
 * 2. Creating a new game
 * 3. Entering player name
 * 4. Creating profile picture
 * 5. Viewing lobby as host
 *
 * Note: This test covers the pre-game flow. Additional tests should be added
 * for the actual game rounds as those features are implemented.
 */

test.describe('Catfish Happy Path', () => {
  test('user can create game and reach lobby as host', async ({ page }) => {
    // Navigate to Catfish game
    await page.goto('/catfish');

    // Verify landing page loaded
    await expect(page.getByAltText('Catfish Game Logo')).toBeVisible();
    await expect(page.getByRole('button', { name: /new game/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /join game/i })).toBeVisible();

    // Click "New Game" button
    await page.getByRole('button', { name: /new game/i }).click();

    // Should navigate to enter name view
    // Note: Adjust selectors based on actual implementation
    await expect(page.getByText(/enter.*name/i)).toBeVisible();

    // Enter player name
    const playerName = `TestPlayer${Date.now()}`;
    const nameInput = page.getByRole('textbox', { name: /name/i }).or(
      page.locator('input[type="text"]').first()
    );
    await nameInput.fill(playerName);
    
    // Submit name
    await page.getByRole('button', { name: /continue|next|done/i }).click();

    // Should navigate to profile picture view
    await expect(
      page.getByText(/profile.*picture|create.*avatar|draw/i)
    ).toBeVisible({ timeout: 10000 });

    // For now, skip drawing and continue
    // In future, could add actual canvas interaction tests
    const continueButton = page.getByRole('button', { 
      name: /continue|next|done|submit/i 
    });
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
    }

    // Should reach lobby
    await expect(
      page.getByText(/lobby|waiting.*players|room.*code/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify player appears in lobby
    await expect(page.getByText(playerName)).toBeVisible();

    // Verify room code is displayed (typically 4-6 characters)
    const roomCodeElement = page.locator('text=/[A-Z0-9]{4,6}/').first();
    await expect(roomCodeElement).toBeVisible();
  });

  test('user can join existing game', async ({ page, context }) => {
    // This test requires a room code from a created game
    // For now, this is a placeholder showing the intended test structure
    
    // Step 1: Create a game in the background (would need helper function)
    // const roomCode = await createTestGame();

    // Step 2: Navigate to join game flow
    await page.goto('/catfish');
    await page.getByRole('button', { name: /join game/i }).click();

    // Should see join game view with room code input
    await expect(page.getByText(/enter.*code|room.*code/i)).toBeVisible();

    // Note: Full implementation requires Firebase setup
    // This test should be expanded once game creation is fully implemented
  });

  test('landing page is responsive', async ({ page }) => {
    await page.goto('/catfish');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByAltText('Catfish Game Logo')).toBeVisible();
    await expect(page.getByRole('button', { name: /new game/i })).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByAltText('Catfish Game Logo')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByAltText('Catfish Game Logo')).toBeVisible();
  });

  test('how to play button is present', async ({ page }) => {
    await page.goto('/catfish');

    const howToPlayButton = page.getByRole('button', { name: /how to play/i });
    await expect(howToPlayButton).toBeVisible();
    
    // Note: Add click behaviour test once How to Play modal is implemented
  });

  test('footer displays correctly', async ({ page }) => {
    await page.goto('/catfish');

    // Footer should be present (adjust selector based on implementation)
    const footer = page.locator('footer').or(
      page.getByText(/release the owl|© 202/i)
    );
    await expect(footer).toBeVisible();
  });
});

/**
 * Additional test scenarios to implement as features are completed:
 * 
 * - Multiple players joining the same lobby
 * - Host starting the game
 * - Round timer functionality
 * - Drawing submission
 * - Prompt submission
 * - Voting mechanism
 * - Results display
 * - Score tracking across rounds
 * - Player disconnection handling
 * - Game completion and return to landing
 */
