// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAccessManager {

    function setTargetFunctionRole(
        address target,
        bytes4[] calldata selectors,
        uint64 roleId
    ) external;

    function revokeRole(uint64 roleId, address account) external;
    function ADMIN_ROLE() external view returns (uint64);

    function labelRole(uint64 roleId, string calldata label) external;
    function setRoleAdmin(uint64 roleId, uint64 adminRoleId) external;
    function setRoleGuardian(uint64 roleId, uint64 guardianRoleId) external;
    function setGrantDelay(uint64 roleId, uint64 grantDelay) external;
}

contract AccessManagerHelper {
    IAccessManager public immutable access_manager;
    address public immutable owner;

    struct TargetRole {
        address target;
        bytes4[] selectors;
    }

    struct Role {
        uint64 id;
        uint64 admin;
        uint64 guardian;
        uint64 grant_delay;
        string label;
        TargetRole[] target_roles;
    }

    constructor(address _access_manager) {
        access_manager = IAccessManager(_access_manager);
        owner = msg.sender;
    }

    modifier only_owner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    /// @notice Mirrors the working JS logic in one transaction
    function batch_submit_roles_config(
    Role[] calldata roles
    ) external only_owner {
        for (uint256 i = 0; i < roles.length; ++i) {
            Role calldata role = roles[i];

            access_manager.labelRole(role.id, role.label);
            access_manager.setRoleAdmin(role.id, role.admin);
            access_manager.setRoleGuardian(role.id, role.guardian);
            access_manager.setGrantDelay(role.id, role.grant_delay);

            for (uint256 j = 0; j < role.target_roles.length; ++j) {
                TargetRole calldata tr = role.target_roles[j];

                access_manager.setTargetFunctionRole(
                    tr.target,
                    tr.selectors,
                    role.id
                );
            }
        }
    }

    /// @dev optional manual cleanup
    function relinquish_admin() external only_owner {
        access_manager.revokeRole(
            access_manager.ADMIN_ROLE(),
            address(this)
        );
    }
}
