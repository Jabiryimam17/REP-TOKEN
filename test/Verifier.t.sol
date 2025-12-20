// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/src/Test.sol";
import {console} from "forge-std/src/console.sol";
import {VerifierSystem} from "../contracts/VerifierSystem.sol";
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2_5Mock.sol";

contract VerifierTest is Test {
    VRFCoordinatorV2_5Mock public coordinator;
    VerifierSystem public verifier_system;
    uint public subscription_id;

    // function setUp() public {

    //     coordinator = new VRFCoordinatorV2_5Mock(10000, 100, 100);
    //     subscription_id = coordinator.createSubscription();
    //     coordinator.fundSubscription(subscription_id, 1e30);
    //     verifier_system = new VerifierSystem(address(1), address(2), address(coordinator), subscription_id);
    //     coordinator.addConsumer(subscription_id, address(verifier_system));
    // }

    // function test_random_number_request() public {
    //     uint request_id = verifier_system.request_randomness(uint32(5));
    //     console.log("request_id: ", request_id , ": subscription id: ", subscription_id);
    //     console.log("verifier_system.subscription_id: ", verifier_system.subscription_id());
    //     coordinator.fulfillRandomWords(request_id, address(verifier_system));
    //     uint[] memory words = verifier_system.get_numbers();
    //     console.log(words.length);
    //     for (uint i = 0; i < words.length; ++i) console.log(words[i]);
    // }
}