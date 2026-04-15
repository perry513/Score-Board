# Requirements Document: Score Rule Selection Feature

## Overview
Enhance the existing Score-Board app to allow users to select between different scoring rules. The app currently supports Mahjong scoring. This update will add support for Scrabble scoring and provide a user interface for rule selection.

## Goals
- Allow users to choose between Mahjong and Scrabble scoring rules.
- Update the scoring logic and UI to reflect the selected rule.
- Ensure the app is extensible for future rule additions.

## Functional Requirements
4. **Score Entry Popup Usability (Scrabble Rule Only)**
   - In the Scrabble score entry popup, the Tab key should move focus between player score text boxes in order.
   - The Enter key should submit the scores if all are filled.

5. **Player Removal by Drag (Scrabble Rule Only)**
   - When the Scrabble rule is selected, allow removing a player by dragging their column header to the side menu (inactive player area).
   - The minimum number of players allowed is 2. Prevent removal if only 2 players remain.

1. **Rule Selection UI**
   - Add a dropdown or toggle for users to select the scoring rule (Mahjong or Scrabble).
   - Display the currently selected rule clearly in the UI.

2. **Dynamic Scoring Logic**
   - Implement Scrabble scoring logic alongside existing Mahjong logic.
   - Update score calculations and displays based on the selected rule.
   - **Mahjong Rule:** Each round, the sum of all player scores must be zero (scores are balanced between players; win/loss is enforced).
   - **Scrabble Rule:** Each player can have an independent score for each round. The sum of scores does not need to be zero. Remove the requirement for toggling win/lose; allow direct entry of each player's score per round.

3. **Score Entry Popup (Scrabble Rule Only)**
   - When the Scrabble rule is selected and a player's score (under their name) is clicked on the main page, the Record Game Score popup should appear.
   - Remove the Chu-Chong button from the popup only for the Scrabble rule.
   - In the popup (Scrabble rule), allow entering a score for each player for the current round.
   - When a player's tile is clicked, the score entered in the text box is assigned to that player for the round (Scrabble rule).
   - On submit (Scrabble rule), check that all players have a score for that round. If so, add the round to the history and reset for a new round.
   - The existing Mahjong rule and its score entry logic must remain unchanged.

3. **Persistence**
   - Remember the user's last selected rule (e.g., using local storage).

4. **Extensibility**
   - Structure the code to allow easy addition of new scoring rules in the future.

## Non-Functional Requirements
- Maintain responsive and intuitive UI/UX.
- Ensure code is modular and maintainable.
- Provide clear error handling for invalid rule selections.

## Out of Scope
- Adding rules other than Mahjong and Scrabble at this stage.

## Acceptance Criteria
- User can select either Mahjong or Scrabble as the scoring rule.
- Scores are calculated and displayed according to the selected rule.
- The selected rule persists across sessions.
- No regression in existing Mahjong scoring functionality.
