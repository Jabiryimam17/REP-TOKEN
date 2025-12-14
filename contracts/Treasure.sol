// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract Treasure is Ownable {
    using SafeERC20 for IERC20;
    IERC20 public reputation_token;
    IERC20 public stable_coin;
    address public reward_vault;
    mapping(address => uint256) public allocated_stable_coin;
    uint public locked_stable_coin;

    IUniswapV2Router02 public uniswap_router = IUniswapV2Router02(0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3);

    constructor(address stable_coin_address) Ownable(msg.sender) {
        stable_coin = IERC20(stable_coin_address);
    }

    function set_reward_vault(address new_reward_vault) public onlyOwner {
        reward_vault = new_reward_vault;
    }

    function set_uniswap_router(address _uniswap_router) public onlyOwner {
        uniswap_router = IUniswapV2Router02(_uniswap_router);
    }
    function set_reputation_token(address reputation_token_address) public onlyOwner {
        reputation_token=IERC20(reputation_token_address);
    }

    function withdraw_tokens(address to, uint256 amount) public onlyOwner {
        require(address(0)!=to, "Null address is not allowed.");
        require(amount > 0, "Zero transfer is not allowed.");
        require(reputation_token.balanceOf(address(this)) >= amount, "Insufficient balance in Treasure");
        reputation_token.safeTransfer(to, amount);
    }

    function get_balance_reputation_token() public view returns (uint256) {
        return reputation_token.balanceOf(address(this));
    }
    function get_balance_stable_coin() public view returns (uint256) {
        return stable_coin.balanceOf(address(this));
    }

    function allocate_stable_coin(address beneficiary, uint256 amount) public onlyOwner {
        require(address(0)!=beneficiary,"Null address is not allowed.");
        require(stable_coin.balanceOf(address(this))-locked_stable_coin >= amount, "Insufficient balance in Treasure.");
        allocated_stable_coin[beneficiary] += amount;
        locked_stable_coin += amount;
    }

    function deallocate_stable_coin(address to, uint256 amount) public onlyOwner {
        require(address(0)!=to, "Null address is not allowed.");
        require(allocated_stable_coin[to] >= amount, "Insufficient allocated stable coin for this address.");
        allocated_stable_coin[to] -= amount;
        locked_stable_coin -= amount;
    }
    function transfer_allocated_stable_coin(address to, uint256 amount) public onlyOwner {
        require(amount > 0, "Zero transfer is not allowed.");
        require(address(0)!=to, "Null address is not allowed.");
        require(allocated_stable_coin[to] >= amount, "Insufficient allocated stable coin for this address.");
        allocated_stable_coin[to] -= amount;
        locked_stable_coin -= amount;
        stable_coin.safeTransfer(to, amount);
    }
    function fill_reward_vault(uint256 amount) public onlyOwner {
        require(amount > 0, "Zero transfer is not allowed.");
        require(reputation_token.balanceOf(address(this)) >= amount, "Insufficient balance in Treasure");
        reputation_token.safeTransfer(reward_vault, amount);
    }

    function swap_reputation_for_stable(uint256 reputation_amount, uint256 min_stable_amount) public onlyOwner {
        require(reputation_amount > 0, "Zero transfer is not allowed.");
        require(reputation_token.balanceOf(address(this)) >= reputation_amount, "Insufficient reputation token balance in Treasure");

        address[] memory path = new address[](2);
        path[0] = address(reputation_token);
        path[1] = address(stable_coin);

       reputation_token.safeIncreaseAllowance(address(uniswap_router), reputation_amount);

        uniswap_router.swapExactTokensForTokens(
            reputation_amount,
            min_stable_amount,
            path,
            address(this),
            block.timestamp + 300
        );
    }

    function swap_stable_for_reputation(uint256 stable_amount, uint256 min_reputation_amount) public onlyOwner {
        require(stable_coin.balanceOf(address(this))-locked_stable_coin >= stable_amount, "Insufficient stable coin balance in Treasure");

        address[] memory path = new address[](2);
        path[0] = address(stable_coin);
        path[1] = address(reputation_token);

        stable_coin.safeIncreaseAllowance(address(uniswap_router), stable_amount);

        uniswap_router.swapExactTokensForTokens(
            stable_amount,
            min_reputation_amount,
            path,
            address(this),
            block.timestamp + 300
        );
    }
    function buy_back(uint amount, address liquidator) public onlyOwner {
        require(stable_coin.balanceOf(address(this)) >= amount, "Insufficient stable coin balance in Treasure");
        stable_coin.safeTransfer(liquidator, amount);
    }
}
