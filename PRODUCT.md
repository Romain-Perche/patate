# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A small private group of friends who already know the Patate card game from playing it with a real deck. They play online, one against one, on phones and on laptops. They do not need the rules explained; they need the table to behave like the real game.

## Product Purpose

Patate lets two friends play their card game together when they cannot share a physical deck. Success means a round feels as fast and as natural as the real table: every rule works, nobody sees a card they should not see, and nobody waits on the interface.

## Positioning

A faithful digital copy of one specific house game that this group already plays, not a generic card platform. The rules are theirs, so the app follows the game, not the other way round.

## Operating Context

- One player creates a room and shares the room code; the other joins with it. A pseudo (nickname) identifies each player.
- Each player has a hidden hand. Players may peek at their own cards; only the owner sees the result.
- On their turn a player draws from the pile or the discard pile, then keeps the card (replacing one in hand) or throws it.
- After each turn a short match phase (5 seconds) lets any player throw a card that matches the top of the discard pile. A player can also pass (Passer) to skip it.
- A thrown Queen lets its owner look at one card (own or rival). A thrown Jack lets its owner swap two cards. The owner may skip the power.
- Any player can call "Patate". The other player then has one last turn, and the round ends with all hands revealed.
- Scoring: lowest hand wins. Joker = -1, 10 of clubs = -2, red Kings = 0, Ace = 1, J/Q/black K = 10, number cards = face value. A card slot emptied by a match counts 0.
- Players can start a new round from the end screen (play again).
- Players use both touch (phones) and mouse (laptops); actions must work with both.

## Capabilities and Constraints

- Stack: Vite + React front end, Node/Express + socket.io server (`server/index.js`, `server/game.js`). The server owns the game state and hides cards each player must not see.
- Exactly 2 players per room. No plan for more players.
- Private project for friends. No accounts, no public lobby, no growth or monetization goals.
- Card faces are image files in `public/images/cards/` (52 cards plus Joker).
- All user-facing text must be in French. Today the code mixes French and English (for example "Create New Game", "Join Game", "Welcome to Patate"); this is a known gap to fix.

## Brand Commitments

- Name: Patate. The in-game call is also "Patate".
- Language: French only. Game terms stay as the group says them (Patate, Jeter, Passer, Pseudo).

## Evidence on Hand

- Real card art: `public/images/cards/`.
- No testimonials, player stats, or public claims exist. Do not invent any.

## Product Principles

1. The real table is the reference. When in doubt, do what the physical game does.
2. Secrets stay secret. A player only sees a card when the rules allow it.
3. Speed over explanation. Players know the rules; actions must be quick to reach, especially during the 5-second match phase.
4. Phone and laptop are equal. Every action must work by touch and by mouse.

## Accessibility & Inclusion

No product-specific requirement established beyond touch and mouse parity on phone and laptop.
