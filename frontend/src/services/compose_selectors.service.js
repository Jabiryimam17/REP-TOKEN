import contracts from "./compose_contracts.service.js"
import job_manager_selectors from "./selectors/job_manager.service.js"
import rpt_selectors from "./selectors/rpt.service.js"
import treasury_selectors from "./selectors/treasury.service.js"
import verifier_selectors from "./selectors/verifier.service.js"
import reward_vault_selectors from "./selectors/reward_vault.service.js"
import registry_selectors from "./selectors/registry.service.js"

export default async function main() {
    return {
        "job_manager": await job_manager_selectors(contracts.job_manager_contract),
        "rpt": await rpt_selectors(contracts.rpt_contract),
        "verifier": await verifier_selectors(contracts.verifier_contract),
        "treasury": await treasury_selectors(contracts.treasury_contract),
        "reward_vault": await reward_vault_selectors(contracts.reward_vault_contract),
        "registry": await registry_selectors(contracts.registry_contract)
    }

}