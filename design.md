my-blockchain-project/
│
├── contracts/              # All Solidity smart contracts
│   ├── ReputationToken.sol
│   ├── JobMarketplace.sol
│   └── ...
│
├── scripts/                # Deployment scripts, migrations, helpers
│   ├── deployToken.js
│   ├── deployMarketplace.js
│   └── verifyContracts.js
│
├── test/                   # Tests for smart contracts
│   ├── token.test.js
│   ├── marketplace.test.js
│   └── helpers.js
│
├── frontend/               # Frontend app (React, Next.js, Vue)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/          # Helpers for web3 calls, API
│   └── package.json
│
├── backend/                # Backend server (Node.js, Python, or other)
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/       # Blockchain interaction, verification logic
│   ├── config/             # Configs for database, blockchain nodes, API keys
│   └── package.json
│
├── hardhat.config.js       # Hardhat project configuration
├── truffle-config.js       # Optional if using Truffle
├── package.json            # Shared dev dependencies
├── .env                    # Environment variables (RPC URLs, private keys)
├── scripts/ci-cd/          # Optional CI/CD scripts
├── README.md
└── docs/                   # Project documentation

struct Job {
address client; //
address freelancer;
bool freelancer_approved=false;
bool freelancer_completed=false;
uint appeal_time;
uint disputes_raised=0;
JOB_STATUS status; //
uint stakes_lost=0; //
uint amount; // 
uint remain_min_verifiers; //
uint time_limit;//
uint expiry_timestamp;
uint level_id; // 
uint category; //
    mapping(address => bool) verifiers_allowed;
}