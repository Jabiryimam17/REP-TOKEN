// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";



contract RandomValuesGenerator is VRFConsumerBaseV2Plus {
    event RequestSent(uint256 request_id, uint32 num_words);
    event RequestFulfilled(uint256 request_id, uint256[] random_words);

    uint256 public s_subscription_id;
    bytes32 constant public key_hash=0x8596b430971ac45bdf6088665b9ad8e8630c9d5049ab54b14dff711bee7c0e26;

    uint32 public callback_gas_limit=100_000;

    uint16 public request_confirmations=2;

    uint32 public max_num_words=10;
    constructor(address coordinator, uint256 subscription_id) VRFConsumerBaseV2Plus(coordinator) {
        s_subscription_id=subscription_id;
    }


}
