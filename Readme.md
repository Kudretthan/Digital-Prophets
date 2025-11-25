# 🚀 DIGITAL PROPHETS | Prediction Terminal

This is a **decentralized prediction market** built on the **Stellar/Soroban** blockchain. Users bet on future events (like gaming news or e-sports results) using XLM, and winning payouts are managed by a Soroban smart contract.

### 💻 Web App (Next.js/React)

The front-end is a sleek, cyber-themed trading terminal interface.

#### 🔑 Key Features:

* **Wallet Connection:** Connects using the **Freighter** wallet for Stellar.
* **Central State:** The `page.tsx` component centrally manages the user's `publicKey` and fetches their basic betting history and XLM balance.
* **Market Display:** `MarketCard.tsx` shows live odds and volume for prediction markets.
* **Betting Modal:** `BetModal.tsx` handles the main action:
    * It prepares and signs a Soroban transaction using the user's connected wallet.
    * It uses **Stellar's RPC** to simulate (prepare) and submit the transaction to the network.
    * It records the bet into **Supabase** (off-chain database) after the transaction is confirmed on the blockchain.
* **Aesthetics:** Uses **JetBrains Mono** font and specific Tailwind CSS colors (`cyber-green`, `cyber-red`, etc.) for a "cyborg terminal" look.
* **News Ticker:** `NewsTicker.tsx` displays important updates at the bottom.

### ⚙️ Soroban Smart Contract (`lib.rs`)

This is the core logic that lives on the Stellar network. It manages the money and the rules of the market.

#### 📋 Main Functions:

1.  **`initialize`**: Sets up the contract and defines an **Admin** address (who can resolve markets).
2.  **`create_market`**: Allows the Admin to start a new betting market.
3.  **`place_bet`**:
    * Takes money (`amount`) from the user's address and transfers it into the contract's pool (`total_yes` or `total_no`).
    * Uses **`token_client.transfer`** to move the XLM (or other token) on the blockchain.
    * Records the user's bet side (`BetInfo`) in the contract's storage.
4.  **`resolve_market`**: Allows the **Admin only** to set the final `outcome` (True/False). This locks the market result.
5.  **`claim_winnings`**:
    * Allows a user to ask for their prize.
    * **Calculation:** Uses the total pool funds and the size of the winning pool to calculate the payout:
        $$Reward = (UserBet * TotalPool) / WinningPool$$
    * Transfers the calculated `reward` back to the user's address.

### 🛠️ Technology Stack Summary

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Blockchain** | **Soroban (Rust)** | Smart Contract Logic and Core Betting Engine. |
| **Web** | **Next.js** | Front-end framework. |
| **Styling** | **Tailwind CSS** | Utility-first styling for "cyber" theme. |

👥 Team

Team Name: DUO LEVELİNG
Members:
Kudrethan ÖZBUDAK – kudrethanozbudak@gmail.com
Bedirhan ÇİFTÇİ – esdbedirhan@outlook.com
| **Wallet** | **Freighter** | Stellar/Soroban wallet connection. |
| **SDK** | **`@stellar/stellar-sdk`** | Preparing and submitting Soroban transactions. |
| **Database** | **Supabase** | Storing off-chain user profiles and bet history. |
