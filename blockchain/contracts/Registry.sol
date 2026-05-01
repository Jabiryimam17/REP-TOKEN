// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

error NullAddress();
import {AccessManaged} from "@openzeppelin/contracts/access/manager/AccessManaged.sol";

contract Registry is AccessManaged {
    address public access_manager;
    address public rpt;
    address public ethiocoin;
    address public treasury;
    address public reward_vault;
    address public job_manager;
    address public verifier;
    address public lp_token;
    address public router;
    address public factory;
    address public pool;

    struct Role {
        string name;
        uint64 id;
    }

    mapping(string => uint64) public roles;
    mapping(uint64 => string) public r_roles;
    uint64 [] public roles_ids;

    struct system_addresses {
        address access_manager;
        address rpt;
        address ethiocoin;
        address treasury;
        address reward_vault;
        address job_manager;
        address verifier;
        address lp_token;
        address router;
        address factory;
        address pool;
    }
    constructor (address _access_manager)  AccessManaged(_access_manager) {
        access_manager = _access_manager;
        roles["GLOBAL_ADMIN"] = 0;
        r_roles[0] = "GLOBAL_ADMIN";
        roles_ids.push(0);
    }
    modifier NullAddressCheck(address _addr) {
        if (_addr == address(0)) revert NullAddress();
        _;
    }
    function set_rpt(address _rpt) external NullAddressCheck(_rpt) restricted {
        rpt = _rpt;
    }


    function set_router(address _router) external NullAddressCheck(_router) restricted {
        router = _router;
    }

    function set_factory(address _factory) external NullAddressCheck(_factory) restricted {
        factory = _factory;
    }

    function set_pool(address _pool) external NullAddressCheck(_pool) restricted {
        pool = _pool;
    }

    function set_ethiocoin(address _ethiocoin) external NullAddressCheck(_ethiocoin) restricted {
        ethiocoin = _ethiocoin;
    }

    function set_treasury(address _treasury) external NullAddressCheck(_treasury) restricted {
        treasury = _treasury;
    }

    function set_reward_vault(address _reward_vault) external NullAddressCheck(_reward_vault) restricted {
        reward_vault = _reward_vault;
    }

    function set_job_manager(address _job_manager) external NullAddressCheck(_job_manager) restricted {
        job_manager = _job_manager;
    }

    function set_verifier(address _verifier) external NullAddressCheck(_verifier) restricted {
        verifier = _verifier;
    }


    function add_roles(Role [] calldata _roles) external restricted {
        for (uint i = 0; i < _roles.length; i++) {
            require(_roles[i].id != 0, "Role ID is Global Admin And Immutable");
            require(
                roles[_roles[i].name] == 0 &&
                bytes(r_roles[_roles[i].id]).length == 0,
                "Role already exists"
            );

            roles[_roles[i].name] = _roles[i].id;
            r_roles[_roles[i].id] = _roles[i].name;
            roles_ids.push(_roles[i].id);
        }
    }

    function add_role(string calldata name, uint64 id) external restricted {
        require(id != 0, "Role ID is Global Admin And Immutable");
        require(roles[name] == 0 && bytes(r_roles[id]).length == 0, "Role name already exists");

        roles[name] = id;
        r_roles[id] = name;
        roles_ids.push(id);
    }

    function update_name(uint64 id, string calldata new_name) external restricted {
        require(id != 0, "Role ID is Global Admin And Immutable");

        string memory current_name = r_roles[id];

        require(bytes(current_name).length != 0, "Role ID does not exist");
        require(roles[new_name] == 0, "Role name already exists");
        roles[new_name] = id;
        r_roles[id] = new_name;
        delete roles[current_name];
    }

    function get_roles() external view returns (Role[] memory) {
        Role[] memory all_roles = new Role[](roles_ids.length);
        for (uint i = 0; i < roles_ids.length; i++) {
            uint64 id = roles_ids[i];
            string memory name = r_roles[id];
            all_roles[i] = Role(name, id);
        }
        return all_roles;
    }

    function get_role_id(string calldata name) external view returns (uint64) {
        require(
            keccak256(bytes(name)) == keccak256("GLOBAL_ADMIN") || roles[name] != 0,
            "Role does not exist"
        );
        return roles[name];
    }

    function get_role_name(uint64 id) external view returns (string memory) {
        string memory name = r_roles[id];
        if (bytes(name).length == 0) {
            revert("Role ID does not exist");
        }
        return name;
    }

    function get_access_manager() external view NullAddressCheck(access_manager) returns (address) {
        return access_manager;
    }

    function get_rpt() external view NullAddressCheck(rpt) returns (address) {
        return rpt;
    }

    function get_ethiocoin() external view NullAddressCheck(ethiocoin) returns (address) {
        return ethiocoin;
    }

    function get_treasury() external view NullAddressCheck(treasury) returns (address) {
        return treasury;
    }

    function get_reward_vault() external view NullAddressCheck(reward_vault) returns (address) {
        return reward_vault;
    }

    function get_job_manager() external view NullAddressCheck(job_manager) returns (address) {
        return job_manager;
    }

    function get_verifier() external view NullAddressCheck(verifier) returns (address) {
        return verifier;
    }

    function get_lp_token() external view NullAddressCheck(pool) returns (address) {
        return pool;
    }

    function get_router() external view NullAddressCheck(router) returns (address) {
        return router;
    }

    function get_factory() external view NullAddressCheck(factory) returns (address) {
        return factory;
    }

    function get_pool() external view returns (address) {
        return this.get_lp_token();
    }

    function get_system_addresses() external view returns (system_addresses memory) {
        return system_addresses({
            access_manager: access_manager,
            rpt: rpt,
            ethiocoin: ethiocoin,
            treasury: treasury,
            reward_vault: reward_vault,
            job_manager: job_manager,
            verifier: verifier,
            lp_token: pool,
            router: router,
            factory: factory,
            pool: pool
        });
    }
}

interface IRegistry {
    function get_rpt() external view returns (address);

    function get_ethiocoin() external view returns (address);

    function get_treasury() external view returns (address);

    function get_reward_vault() external view returns (address);

    function get_job_manager() external view returns (address);

    function get_lp_token() external view returns (address);

    function get_verifier() external view returns (address);

    function get_router() external view returns (address);

    function get_factory() external view returns (address);

    function get_pool() external view returns (address);
}
