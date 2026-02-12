"use client";

import React, { useState, useEffect } from 'react';
import compose_selectors from '@/services/compose_selectors.service';
import { ethers } from 'ethers';
import amh, { assign_addresses } from "../../../services/amh.service.js"
import { add_roles, get_roles } from "../../../services/roles.service.js"

const RoleAddressAssignment = ({ roles, addressAssignments, setAddressAssignments }) => {
  const [newAddress, setNewAddress] = useState({
    address: '',
    delay: 0,
    roleId: ''
  });
  const [error, setError] = useState('');

  const handleAddAssignment = () => {
    if (!newAddress.address || !newAddress.roleId) {
      setError('Address and Role are required');
      return;
    }

    if (!ethers.isAddress(newAddress.address)) {
      setError('Invalid Ethereum address');
      return;
    }

    const updated = { ...addressAssignments };
    if (!updated[newAddress.roleId]) updated[newAddress.roleId] = [];
    
    // Check for duplicates
    if (updated[newAddress.roleId].some(a => a.address.toLowerCase() === newAddress.address.toLowerCase())) {
      setError('Address already assigned to this role');
      return;
    }

    updated[newAddress.roleId] = [...updated[newAddress.roleId], { 
      address: newAddress.address, 
      delay: parseInt(newAddress.delay) || 0 
    }];
    setAddressAssignments(updated);
    setNewAddress({ ...newAddress, address: '', delay: 0 });
    setError('');
  };

  const removeAssignment = (roleId, address) => {
    const updated = { ...addressAssignments };
    updated[roleId] = updated[roleId].filter(a => a.address !== address);
    setAddressAssignments(updated);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">4. Assign Addresses to Roles</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Grant roles to specific Ethereum addresses with an optional execution delay.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Ethereum Address</label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
              value={newAddress.address}
              onChange={e => setNewAddress({...newAddress, address: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target Role</label>
            <select
              className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              value={newAddress.roleId}
              onChange={e => setNewAddress({...newAddress, roleId: e.target.value})}
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id.toString()} value={role.id.toString()}>
                  {role.name} (ID: {role.id.toString()})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grant Delay (sec)</label>
            <input
              type="number"
              className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              value={newAddress.delay}
              onChange={e => setNewAddress({...newAddress, delay: e.target.value})}
            />
          </div>
          <div className="md:col-span-4">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button
              onClick={handleAddAssignment}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Add Address Assignment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id.toString()} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="font-bold text-indigo-600 dark:text-indigo-400">{role.name}</div>
                <div className="text-xs text-slate-500">ID: {role.id.toString()}</div>
              </div>
              <div className="p-4 flex-grow space-y-2">
                {(addressAssignments[role.id.toString()] || []).map((assignment, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="truncate mr-2">
                      <div className="font-mono truncate" title={assignment.address}>{assignment.address}</div>
                      <div className="text-slate-400">Delay: {assignment.delay}s</div>
                    </div>
                    <button 
                      onClick={() => removeAssignment(role.id.toString(), assignment.address)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                {(addressAssignments[role.id.toString()] || []).length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No addresses assigned
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FunctionOverview = ({ discoveredFunctions }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Contract Functions Overview</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          The following functions across the system require access control.
        </p>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Contract & Signature</th>
                <th className="px-6 py-3 font-semibold text-right">Selector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {Object.entries(discoveredFunctions).map(([contractName, selectors]) => (
                selectors.map((item, index) => (
                  <tr key={`${contractName}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-6 py-4">
                       <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">{contractName}</span>
                       <span className="font-mono text-xs text-slate-500">{item.signature}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-right text-slate-400">{item.selector}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RoleBasicForm = ({ roles, setRoles }) => {
  const [newRole, setNewRole] = useState({
    label: '',
    role_id: '',
  });
  const [error, setError] = useState('');

  const handleAddRole = () => {
    if (!newRole.label || !newRole.role_id) {
      setError('Both Name and Role ID are required');
      return;
    }

    if (roles.find(r => r.role_id === newRole.role_id)) {
      setError('Role ID must be unique');
      return;
    }

    if (roles.find(r => r.label.toLowerCase() === newRole.label.toLowerCase())) {
      setError('Role Name must be unique');
      return;
    }

    setRoles([...roles, { 
      label: newRole.label,
      role_id: newRole.role_id,
      role_admin: '', // Leave empty to force configuration in Step 2
      role_guardian: '', 
      grant_delay: 0 
    }]);
    setNewRole({
      label: '',
      role_id: '',
    });
    setError('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">1. Define Basic Roles</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Start by defining the names and IDs for the roles you want to create.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-sm font-medium mb-1">Role Name</label>
            <input
              type="text"
              placeholder="e.g. Admin"
              className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              value={newRole.label}
              onChange={e => setNewRole({...newRole, label: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role ID (uint64)</label>
            <input
              type="number"
              placeholder="e.g. 1"
              className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              value={newRole.role_id}
              onChange={e => setNewRole({...newRole, role_id: e.target.value})}
            />
          </div>
          <div className="md:col-span-2">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <button
              onClick={handleAddRole}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Add Basic Role
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {roles.map((role, index) => (
            <div key={index} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
              <div>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{role.label}</span>
                <span className="ml-2 text-xs text-slate-500">ID: {role.role_id}</span>
              </div>
              <button
                onClick={() => setRoles(roles.filter((_, i) => i !== index))}
                className="text-red-500 hover:text-red-700 text-sm font-medium p-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RoleConfigForm = ({ roles, setRoles }) => {
  const updateRole = (index, field, value) => {
    const updatedRoles = [...roles];
    updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    setRoles(updatedRoles);
  };

  // Add GLOBAL_ADMIN as a default option for Admin/Guardian
  const roleOptions = [{ label: 'GLOBAL_ADMIN', role_id: '0' }, ...roles];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">2. Configure Role Governance</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Set the Admin, Guardian, and Grant Delay for each role you defined. Roles with missing configurations are highlighted in red.
        </p>
        
        <div className="space-y-4">
          {roles.map((role, index) => {
            const isComplete = role.role_admin !== '' && role.role_guardian !== '';
            
            return (
              <div 
                key={role.role_id} 
                className={`p-6 rounded-xl border-2 transition-colors ${
                  isComplete 
                    ? 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800' 
                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{role.label}</span>
                    <span className="ml-2 text-sm text-slate-500 font-mono">ID: {role.role_id}</span>
                  </div>
                  {!isComplete && (
                    <span className="text-red-500 text-xs font-bold uppercase tracking-wider">Incomplete</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role Admin</label>
                    <select
                      className={`w-full p-2 rounded bg-white dark:bg-slate-800 border ${
                        role.role_admin === '' ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                      value={role.role_admin}
                      onChange={e => updateRole(index, 'role_admin', e.target.value)}
                    >
                      <option value="">Select Admin Role</option>
                      {roleOptions.map(opt => (
                        <option key={opt.role_id} value={opt.role_id}>
                          {opt.label} (ID: {opt.role_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Role Guardian</label>
                    <select
                      className={`w-full p-2 rounded bg-white dark:bg-slate-800 border ${
                        role.role_guardian === '' ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                      }`}
                      value={role.role_guardian}
                      onChange={e => updateRole(index, 'role_guardian', e.target.value)}
                    >
                      <option value="">Select Guardian Role</option>
                      {roleOptions.map(opt => (
                        <option key={opt.role_id} value={opt.role_id}>
                          {opt.label} (ID: {opt.role_id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Grant Delay (sec)</label>
                    <input
                      type="number"
                      className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                      value={role.grant_delay}
                      onChange={e => updateRole(index, 'grant_delay', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {roles.length === 0 && (
            <div className="text-center py-12 text-slate-500 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No roles defined. Please go back to Step 1.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SelectorAssignment = ({ roles, discoveredFunctions, roleAssignments, setRoleAssignments }) => {
  // Flatten discovered functions into a list of all selectable functions
  const allFunctions = Object.entries(discoveredFunctions).flatMap(([contractName, selectors]) => 
    selectors.map(s => ({ ...s, contractName, id: `${contractName}-${s.selector}` }))
  );

  const unassignedFunctions = allFunctions.filter(func => 
    !Object.values(roleAssignments).some(assignedList => 
      assignedList.some(f => f.id === func.id)
    )
  );

  const assignFunctionToRole = (func, roleId) => {
    const updated = { ...roleAssignments };
    if (!updated[roleId]) updated[roleId] = [];
    updated[roleId] = [...updated[roleId], func];
    setRoleAssignments(updated);
  };

  const removeFunctionFromRole = (roleId, funcId) => {
    const updated = { ...roleAssignments };
    updated[roleId] = updated[roleId].filter(f => f.id !== funcId);
    setRoleAssignments(updated);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Selector Assignment</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Assign contract functions to the roles defined in Step 1.
        </p>

        <div className="flex overflow-x-auto gap-6 pb-6 min-h-[400px]">
          {roles.map((role) => (
            <div key={role.role_id} className="flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-t-xl">
                <div className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{role.label}</div>
                <div className="text-xs text-slate-400">ID: {role.role_id}</div>
              </div>
              <div className="p-4 flex-grow space-y-3">
                {(roleAssignments[role.role_id] || []).map((func) => (
                  <div key={func.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm flex justify-between items-center group">
                    <div className="truncate">
                      <div className="font-bold text-[10px] text-slate-500">{func.contractName}</div>
                      <div className="font-mono text-xs truncate" title={func.signature}>{func.signature}</div>
                    </div>
                    <button 
                      onClick={() => removeFunctionFromRole(role.role_id, func.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                {(roleAssignments[role.role_id] || []).length === 0 && (
                  <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-slate-400 text-xs text-center px-4">
                    Click unassigned functions below to assign to this role
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {roles.length === 0 && (
            <div className="w-full h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500">
              <span className="font-bold">No roles created yet. Go back to Step 1.</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          Unassigned Functions
          <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-500">{unassignedFunctions.length}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {unassignedFunctions.map((func) => (
            <div 
              key={func.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                   <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{func.contractName}</div>
                   <div className="text-xs font-mono truncate max-w-[200px]" title={func.signature}>{func.signature}</div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{func.selector}</div>
              </div>
              <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
                {roles.map(role => (
                  <button
                    key={role.role_id}
                    onClick={() => assignFunctionToRole(func, role.role_id)}
                    className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded transition-colors"
                  >
                    + {role.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {unassignedFunctions.length === 0 && allFunctions.length > 0 && (
            <div className="col-span-full text-center py-4 text-green-500 text-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              All functions assigned to roles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AccessControlPage() {
  const [step, setStep] = useState(1);
  const [discoveredFunctions, setDiscoveredFunctions] = useState({});
  const [roles, setRoles] = useState([]);
  const [onChainRoles, setOnChainRoles] = useState([]);
  const [roleAssignments, setRoleAssignments] = useState({});
  const [addressAssignments, setAddressAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRegisteringRoles, setIsRegisteringRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = async () => {
    if (step === 1) {
      if (roles.length === 0) {
        alert("Please add at least one role.");
        return;
      }
      
      setIsRegisteringRoles(true);
      try {
        const rolesToRegister = roles.map(r => ({
          name: r.label,
          id: BigInt(r.role_id)
        }));
        await add_roles(rolesToRegister);
        setStep(2);
      } catch (error) {
        console.error("Failed to register roles in Registry:", error);
        alert("Error registering roles: " + (error.reason || error.message));
      } finally {
        setIsRegisteringRoles(false);
      }
    } else if (step === 2) {
      const incomplete = roles.some(r => r.role_admin === '' || r.role_guardian === '');
      if (incomplete) {
        alert("Please complete the configuration for all roles.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
        setLoading(true);
        try {
            const fetchedRoles = await get_roles();
            setOnChainRoles(fetchedRoles);
            setStep(4);
        } catch (error) {
            console.error("Failed to fetch roles from chain:", error);
            alert("Error fetching roles: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    }
  };

  const handle_submit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);

    const formatted_roles = roles.map(role => {
      // Group assignments by target address
      const assignments = roleAssignments[role.role_id] || [];
      const targetMap = {};

      for (const assignment of assignments) {
        if (!targetMap[assignment.target]) {
          targetMap[assignment.target] = [];
        }

        // selector must already be bytes4: "0x????????"
        targetMap[assignment.target].push(assignment.selector);
      }

      const target_roles = Object.entries(targetMap).map(
          ([target, selectors]) => ({
            target,
            selectors
          })
      );

      return {
        id: BigInt(role.role_id),
        admin: BigInt(role.role_admin || 0),
        guardian: BigInt(role.role_guardian || 0),
        grant_delay: BigInt(role.grant_delay || 0),
        label: role.label,
        target_roles
      };
    });

    try {
      await amh(formatted_roles);
      
      // Now assign addresses if any
      const assignmentInput = Object.entries(addressAssignments).map(([roleId, accounts]) => ({
        id: BigInt(roleId),
        accounts: accounts.map(a => ({
          address: a.address,
          duration: BigInt(a.delay)
        }))
      }));

      if (assignmentInput.length > 0) {
        await assign_addresses(assignmentInput);
      }

      alert("Access control configuration and address assignments submitted successfully!");
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Since compose_selectors might not work perfectly in client-side due to top-level await in compose_contracts
        // We'll try to call it, but have a fallback or warning
        const selectors = await compose_selectors();
        
        // Flatten selectors for the UI
        const normalized = {};
        Object.entries(selectors).forEach(([key, val]) => {
          normalized[key] = val;
        });

        setDiscoveredFunctions(normalized);
      } catch (error) {
        console.error("Error fetching selectors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center">Loading contract metadata...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Access Control Configuration</h1>
          <p className="text-slate-600 dark:text-slate-400">Configure roles and function permissions for the REP TOKEN system.</p>
        </header>

        {/* Wizard Progress */}
        <div className="flex items-center justify-center mb-12">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300'} font-bold`}>1</div>
            <span className="ml-2 font-medium">Basic Info</span>
          </div>
          <div className="w-12 h-px bg-slate-300 mx-3"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300'} font-bold`}>2</div>
            <span className="ml-2 font-medium">Governance</span>
          </div>
          <div className="w-12 h-px bg-slate-300 mx-3"></div>
          <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300'} font-bold`}>3</div>
            <span className="ml-2 font-medium">Functions</span>
          </div>
          <div className="w-12 h-px bg-slate-300 mx-3"></div>
          <div className={`flex items-center ${step >= 4 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 4 ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300'} font-bold`}>4</div>
            <span className="ml-2 font-medium">Addresses</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl min-h-[600px]">
          {step === 1 && (
            <RoleBasicForm roles={roles} setRoles={setRoles} />
          )}

          {step === 2 && (
            <div>
              <RoleConfigForm roles={roles} setRoles={setRoles} />
            </div>
          )}

          {step === 3 && (
            <SelectorAssignment 
              roles={roles} 
              discoveredFunctions={discoveredFunctions}
              roleAssignments={roleAssignments} 
              setRoleAssignments={setRoleAssignments} 
            />
          )}

          {step === 4 && (
            <RoleAddressAssignment 
              roles={onChainRoles} 
              addressAssignments={addressAssignments}
              setAddressAssignments={setAddressAssignments}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || isSubmitting}
            className={`px-8 py-3 rounded-lg font-bold transition-all ${step === 1 || isSubmitting ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
          >
            Previous
          </button>
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={isRegisteringRoles || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-indigo-500/30 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isRegisteringRoles ? 'Registering...' : loading ? 'Loading...' : `Next: ${step === 1 ? 'Governance' : step === 2 ? 'Functions' : 'Addresses'}`}
            </button>
          ) : (
            <button
              onClick={handle_submit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-green-500/30 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Finish Configuration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
