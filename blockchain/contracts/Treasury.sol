// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRegistry} from "./Registry.sol";
contract Treasury is ReentrancyGuard, AccessManaged {
    using SafeERC20 for IERC20;
    IRegistry public registry;
    mapping(address => uint256) public allocated_stable_coin;
    uint public locked_stable_coin;


    constructor(address _registry, address _access_manager) AccessManaged(_access_manager) {
        registry = IRegistry(_registry);
    }

    

    function _reward_vault() internal view returns (address) {
        return registry.get_reward_vault();
    }
    function _rpt() internal view returns (IERC20) {
        return IERC20(registry.get_rpt());
    }

    function _ethiocoin() internal view returns (IERC20) {
        return IERC20(registry.get_ethiocoin());
    }

    function _job_manager() internal view returns (address) {
        return registry.get_job_manager();
    }

    function _router() internal view returns (IUniswapV2Router02) {
        return IUniswapV2Router02(registry.get_router());
    }

    

    function withdraw_tokens(address to, uint256 amount) public restricted {
        require(address(0)!=to, "Null address is not allowed.");
        require(amount > 0, "Zero transfer is not allowed.");
        require(_rpt().balanceOf(address(this)) >= amount, "Insufficient balance in Treasure");
        _rpt().safeTransfer(to, amount);
    }

    function get_balance_reputation_token() public view returns (uint256) {
        return _rpt().balanceOf(address(this));
    }
    function get_balance_stable_coin() public view returns (uint256) {
        return _ethiocoin().balanceOf(address(this));
    }

    function allocate_stable_coin(address beneficiary, uint256 amount) public restricted {
        require(address(0)!=beneficiary,"Null address is not allowed.");
        require(_ethiocoin().balanceOf(address(this))-locked_stable_coin >= amount, "Insufficient balance in Treasure.");
        allocated_stable_coin[beneficiary] += amount;
        locked_stable_coin += amount;
    }

    function deallocate_stable_coin(address to, uint256 amount) public restricted {
        require(address(0)!=to, "Null address is not allowed.");
        require(allocated_stable_coin[to] >= amount, "Insufficient allocated stable coin for this address.");
        allocated_stable_coin[to] -= amount;
        locked_stable_coin -= amount;
    }
    function transfer_allocated_stable_coin(address to, uint256 amount) public restricted nonReentrant {
        require(amount > 0, "Zero transfer is not allowed.");
        require(address(0)!=to, "Null address is not allowed.");
        require(allocated_stable_coin[to] >= amount, "Insufficient allocated stable coin for this address.");
        allocated_stable_coin[to] -= amount;
        locked_stable_coin -= amount;
        _ethiocoin().safeTransfer(to, amount);
    }
    function fill_reward_vault(uint256 amount) public restricted {
        require(amount > 0, "Zero transfer is not allowed.");
        require(_rpt().balanceOf(address(this)) >= amount, "Insufficient balance in Treasure");
        _rpt().safeTransfer(_reward_vault(), amount);
    }

    function swap_reputation_for_stable(uint256 reputation_amount, uint256 min_stable_amount) public restricted {
        require(reputation_amount > 0, "Zero transfer is not allowed.");
        require(_rpt().balanceOf(address(this)) >= reputation_amount, "Insufficient reputation token balance in Treasure");

        address[] memory path = new address[](2);
        path[0] = address(_rpt());
        path[1] = address(_ethiocoin());
        IUniswapV2Router02 router = _router();
       _rpt().safeIncreaseAllowance(address(router), reputation_amount);

        router.swapExactTokensForTokens(
            reputation_amount,
            min_stable_amount,
            path,
            address(this),
            block.timestamp + 300
        );
    }

    function swap_stable_for_reputation(uint256 stable_amount, uint256 min_reputation_amount) public restricted {
        require(_ethiocoin().balanceOf(address(this))-locked_stable_coin >= stable_amount, "Insufficient stable coin balance in Treasure");

        address[] memory path = new address[](2);
        path[0] = address(_ethiocoin());
        path[1] = address(_rpt());
        IUniswapV2Router02 router = _router();
        _ethiocoin().safeIncreaseAllowance(address(router), stable_amount);
        router.swapExactTokensForTokens(
            stable_amount,
            min_reputation_amount,
            path,
            address(this),
            block.timestamp + 300
        );
    }
    function buy_back(uint amount, address liquidator) public restricted {
        require(_ethiocoin().balanceOf(address(this)) >= amount, "Insufficient stable coin balance in Treasure");
        _ethiocoin().safeTransfer(liquidator, amount);
    }
    
    function pay_back_rpt(address to, uint amount) external nonReentrant() {
        require(msg.sender==_job_manager() || msg.sender==_reward_vault());
        _rpt().safeTransfer(to, amount);
    }

    function pay_back_stable_coin(address to, uint amount) external nonReentrant() {
        require(msg.sender==_job_manager() || msg.sender==_reward_vault());
        _ethiocoin().safeTransfer( to, amount);
    }
}
