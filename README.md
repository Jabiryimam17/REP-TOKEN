#
REP TOKEN — Verifier‑driven Freelancer–Employer Protocol (Stablecoin payouts, RPT incentives, Chainlink VRF)

This repository implements a blockchain‑native marketplace where clients and freelancers transact in a stablecoin while incentives, penalties, and verifier_address economics are governed by a separate ERC‑20 reputation token (`RPT`). The protocol uses on‑chain random selection of verifiers through Chainlink VRF to validate work, and applies a transparent, game‑theoretic reward/slashing scheme for all parties.

You can browse the contracts in `contracts/` and the Solidity tests in `test/`. The project is built with Hardhat 3 and currently sits at the end of the Testing stage in our delivery roadmap.

Key highlights of the engineering approach:
- Separation of payment and incentive layers: stablecoin for value transfer, `RPT` for alignment, staking, and penalties.
- Verifier marketplace with category‑based pools and on‑chain random sampling via Chainlink VRF v2 Plus.
- Commit–reveal decision flow for verifiers to minimize manipulation and improve liveness assumptions.
- Pull‑based reward accounting to avoid unbounded loops and reduce gas risks.
- Explicit state machines for jobs and disputes; reentrancy protection and careful use of OZ libraries.

Note: An early design sketch exists at `design.md`. Actual contract names and flows in code are authoritative.

## Architecture at a Glance
- JobPayingSystem.sol
  - Orchestrates the client–freelancer workflow: job posting, hiring, acceptance, completion, dispute creation, and settlement.
  - Enforces level‑based staking parameters, payment durations, and fee splits.
  - Uses a stablecoin (configurable ERC‑20) to escrow job amounts and fees.
  - Inherits verifier_address mechanics from `VerifierSystem`.
- VerifierSystem.sol
  - Manages verifier_address registration and staking by category; tracks locked/staked balances per verifier_address.
  - Integrates Chainlink VRF v2 Plus for unbiased random selection of verifiers per dispute (`request_sent`, `request_fulfilled`).
  - Implements commit–reveal for verifier_address scoring (`hashed_decision_submitted`, `decision_revealed`).
  - Computes rewards and slashes; credits pull‑based `pending_rewards` and `treasury_pending` for the treasury_address.
- ReputationToken.sol
  - ERC‑20 token (`RPT`) used for staking, penalties, and incentive distribution.
  - Ownable mint/burn functions to support treasury_address operations and protocol economics.
- EthioCoin.sol
  - Example ERC‑20 used as the protocol’s stablecoin in tests and local flows.
- Treasure.sol / RewardVault.sol
  - Treasury and rewards accounting modules (extensible for DEX interactions and vaulting strategies).

## Economic Model (high‑level)
- Stablecoin is used for job payments and fees; funds are transferred with explicit approvals.
- `RPT` is staked by participants according to job level parameters. Slashing applies for misbehavior or failed verification.
- Verifier rewards are split among verifiers, the treasury_address, and may include a portion allocated back to the honest disputing party.
- Level configuration (`Level`) sets min verifier_address portion, client/freelancer stake amounts, max payout, and payment duration.

## Verifier Selection and Security
- Random Sampling: Verifiers are selected using Chainlink VRF v2 Plus via `VRFConsumerBaseV2Plus` and `VRFV2PlusClient`. Each VRF request maps to an internal job/dispute ID.
- Commit–Reveal: Verifiers first commit a hashed score; after the submission window they reveal scores. This reduces coordination attacks and frontrunning.
- Slashing & Rewards: Misbehaving or low‑weight verifiers are slashed (`slash_bps`), redistributing tokens to honest actors and the treasury_address.
- Pull‑based Claims: Rewards are claimed via `pending_rewards` to prevent gas‑intensive loops and denial‑of‑service vectors.
- Reentrancy: Critical external‑token operations are guarded by `ReentrancyGuard`.
- Trusted Libraries: Uses OpenZeppelin for ERC‑20 and access control primitives.

## Delivery Roadmap and Current Stage
1. Basic contracts ✓
2. Testing ✓ (current: end of testing stage)
3. Security hardening (audits, invariants, fuzzing, formal checks)
4. Optimizations (gas profiling, storage packing, micro‑architecture improvements)
5. Backend and Frontend integration (indexers, services, UI flows)

## What’s Tested Today
Solidity tests are written in Foundry‑style `.t.sol` and executed through Hardhat 3:
- `test/JobPayingSystem.t.sol`
  - Level initialization and ordering
  - Freelancer registration constraints
  - Job lifecycle preconditions (amounts, fees, durations) and permissioning
  - Fee/stake checks and category/verifier_address expectations
- `test/ReputationToken.t.sol`
  - ERC‑20 semantics, allowances, owner‑gated mint/burn, and ownership transfers
  - Negative paths for approvals, burns, and transfers
- `test/Treasure.t.sol`
  - Treasury behaviors relevant to mint/burn/flows (as applicable)

Chainlink VRF usage is present in `VerifierSystem.sol`; in‑depth VRF integration tests are planned next, alongside fuzzing and invariants for the commit–reveal and settlement mechanics.

## Developer Quickstart
Requirements
- Node.js 18+
- npm 9+
- Optional: Foundry toolchain (for local reproduction of Foundry UX; not required to run tests via Hardhat)

Install
- `npm install`

Build & Test
- Compile: `npx hardhat compile`
- Run all tests: `npx hardhat test`
- Only Solidity tests: `npx hardhat test solidity`
- Clean: `npx hardhat clean`

Networks and Env
- Configure `.env` (for Sepolia or other networks):
  - `SEPOLIA_RPC_URL=https://...`
  - `SEPOLIA_PRIVATE_KEY=0x...`
- Hardhat networks are defined in `hardhat.config.ts` (EDR Hardhat L1/OP types and `sepolia`).
- VRF: provide a v2 Plus subscription and coordinator details appropriate for your chain when deploying.

Scripts
- `scripts/send-op-tx.ts` — sample EOA interaction on the OP‑type local chain. Run with `npx ts-node scripts/send-op-tx.ts`.

## Security Posture (in progress)
- Access Controls: owner‑gated admin for fee/treasury_address/level parameters; OZ `Ownable` used where applicable.
- Token Interactions: uses `SafeERC20` and pull‑based claiming; explicit approvals are required; treasury_address acts as sink/source.
- Invariants & Fuzzing: planned with Hardhat/Foundry integrations for verifier_address selection, commit–reveal timing, and settlement.
- VRF Considerations: request/fulfill lifecycle tested on local; staging on Sepolia with real VRF subscription is planned.
- Upgradability: current contracts are not upgradeable; focus is on simplicity and auditability.

## Project Structure
- `contracts/` — Solidity smart contracts (JobPayingSystem, VerifierSystem, ReputationToken, EthioCoin, Treasure, RewardVault)
- `test/` — Solidity tests (`*.t.sol`, Foundry‑style)
- `scripts/` — Utility scripts
- `ignition/` — Deployment modules placeholder
- `hardhat.config.ts` — Hardhat 3 configuration (Solidity 0.8.28)
- `artifacts/`, `cache/`, `types/` — generated
- `design.md` — draft design notes

## Notes
- Chainlink VRF docs: https://docs.chain.link/vrf
- Hardhat 3 docs: https://hardhat.org/docs
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Uniswap V2: https://docs.uniswap.org/protocol/V2/overview

## License
No explicit license has been committed yet. Consider adding MIT/Apache‑2.0 or another suitable license.
