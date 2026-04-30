// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";
import {IRegistry} from "./Registry.sol";
error NullAddress();
error ZeroAmount();
error InsufficientBalance(uint balance, uint requested);
error InsufficientLockedBalance(uint locked_balance, uint requested);
error Unauthorized();
contract Treasury is ReentrancyGuard, AccessManaged {
    using SafeERC20 for IERC20;
    IRegistry public registry;
    mapping(address => uint256) public allocated_stable_coin;
    uint public locked_stable_coin;


    constructor(address _registry, address _access_manager) AccessManaged(_access_manager) {
        if (_registry == address(0) || _access_manager==address(0)) revert NullAddress();
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
    function _verifier() internal view returns (address) {
        return registry.get_verifier();
    }

    function _router() internal view returns (IUniswapV2Router02) {
        return IUniswapV2Router02(registry.get_router());
    }

    

    function withdraw_tokens(address to, uint256 amount) public restricted {
        if (amount==0) revert ZeroAmount();
        if (address(0)==to) revert NullAddress();
        _rpt().safeTransfer(to, amount);
    }

    function get_balance_reputation_token() public view returns (uint256) {
        return _rpt().balanceOf(address(this));
    }
    function get_balance_stable_coin() public view returns (uint256) {
        return _ethiocoin().balanceOf(address(this));
    }

    function allocate_stable_coin(address beneficiary, uint256 amount) public restricted {
        if (amount==0) revert ZeroAmount();
        if (beneficiary == address(0)) revert NullAddress();
        if (_ethiocoin().balanceOf(address(this))-locked_stable_coin < amount) revert InsufficientBalance(_ethiocoin().balanceOf(address(this))-locked_stable_coin, amount);
        allocated_stable_coin[beneficiary] += amount;
        locked_stable_coin += amount;
    }

    function deallocate_stable_coin(address to, uint256 amount) public restricted {
        if (to == address(0)) revert NullAddress();
        if (allocated_stable_coin[to] < amount) revert InsufficientLockedBalance(allocated_stable_coin[to], amount);
        allocated_stable_coin[to] -= amount;
        locked_stable_coin -= amount;
    }
    function transfer_allocated_stable_coin(address to, uint256 amount) public restricted nonReentrant {
        if (amount==0) revert ZeroAmount();
        if (address(0)==to) revert NullAddress();
        if (allocated_stable_coin[to] < amount) revert InsufficientLockedBalance(allocated_stable_coin[to], amount);
        allocated_stable_coin[to] -= amount;
        locked_stable_coin -= amount;
        _ethiocoin().safeTransfer(to, amount);
    }
    function fill_reward_vault(uint256 amount) public restricted {
        if (amount>0) _rpt().safeTransfer(_reward_vault(), amount);
    }

    function swap_reputation_for_stable(uint256 reputation_amount, uint256 min_stable_amount) public restricted {
        if (reputation_amount == 0) revert ZeroAmount();
        if (_rpt().balanceOf(address(this)) < reputation_amount) revert InsufficientBalance(_rpt().balanceOf(address(this)), reputation_amount);

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
        if (stable_amount == 0) revert ZeroAmount();
        if (_ethiocoin().balanceOf(address(this))-locked_stable_coin < stable_amount) revert InsufficientBalance(_ethiocoin().balanceOf(address(this))-locked_stable_coin, stable_amount);

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
        if (amount > _rpt().balanceOf(address(this))) revert InsufficientBalance(_rpt().balanceOf(address(this)), amount);
        if (amount > 0) _ethiocoin().safeTransfer(liquidator, amount);
    }
    
    function pay_back_rpt(address to, uint amount) external nonReentrant() {
        if (msg.sender!=_job_manager() && msg.sender!=_reward_vault() && msg.sender!=_verifier()) revert Unauthorized();
        if (amount > 0) _rpt().safeTransfer(to, amount);
    }

    function pay_back_stable_coin(address to, uint amount) external nonReentrant() {
        if (msg.sender!=_job_manager() && msg.sender!=_reward_vault() && msg.sender!=_verifier()) revert Unauthorized();
        if (amount > 0 ) _ethiocoin().safeTransfer( to, amount);
    }
}
