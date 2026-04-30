// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {VerifierSystem} from "../contracts/VerifierSystem.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
import {RPTAccessManager} from "../contracts/RPTAccessManager.sol";
import {EthioCoin} from "../contracts/EthioCoin.sol";
import {ReputationToken} from "../contracts/ReputationToken.sol";
import {Registry} from "../contracts/Registry.sol";
import {Treasury} from "../contracts/Treasury.sol";
import {JobPayingSystem} from "../contracts/JobPayingSystem.sol";
import {VRFCoordinatorV2_5Mock} from "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";
contract JobVerifierTest is Test {
    VerifierSystem public verifier_system;
    RPTAccessManager public access_manager;
    ReputationToken public reputation_token;
    EthioCoin public ethio_coin;
    Registry public registry;
    Treasury public treasury;
    JobPayingSystem public job_manager;
    VRFCoordinatorV2_5Mock public vrf_coordinator;

    uint256 public subscription_id;

    bytes32 public key_hash =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

    address public owner;

    function setUp() public {

        owner = address(this);

        access_manager = new RPTAccessManager();
        registry = new Registry(address(access_manager));
        reputation_token = new ReputationToken(address(access_manager));
        ethio_coin = new EthioCoin();
        treasury = new Treasury(address(registry), address(access_manager));
        job_manager = new JobPayingSystem(address(registry), address(access_manager));
        registry.set_ethiocoin(address(ethio_coin));
        registry.set_rpt(address(reputation_token));
        registry.set_treasury(address(treasury));
        registry.set_reward_vault(address(0x789));
        registry.set_job_manager(address(job_manager));

        // ---------- VRF Setup ----------
        uint96 base_fee = 0.1 ether;
        uint96 gas_price_link = 1e9;
        int wei_link = 1e18;
        uint256 amount_fund = 100 ether;

        vrf_coordinator = new VRFCoordinatorV2_5Mock(
            base_fee,
            gas_price_link,
            wei_link
        );

        subscription_id = vrf_coordinator.createSubscription();

        vrf_coordinator.fundSubscription(subscription_id, amount_fund);

        // ---------- Deploy Verifier ----------
        verifier_system = new VerifierSystem(
            address(vrf_coordinator),
            subscription_id,
            address(registry),
            address(access_manager)
        );

        vrf_coordinator.addConsumer(
            subscription_id,
            address(verifier_system)
        );

        registry.set_verifier(address(verifier_system));
 
    }

}