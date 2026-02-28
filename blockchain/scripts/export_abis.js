import fs from "fs";
import path from "path";


export default async function main() {
    const contracts = [
        "Registry",
        "JobPayingSystem",
        "VerifierSystem",
        "Treasury",
        "RPTAccessManager",
        "EthioCoin",
        "RewardVault",
        "ReputationToken",
        "AccessManagerHelper",
        "UniswapV2Router02",
        "UniswapV2Factory",
        "WETH9"
    ]

    const artifacts_dir=path.resolve(process.cwd(), "artifacts/contracts");

    const front_out_dir=path.resolve(process.cwd(), "../frontend/src/abis");
    const back_out_dir=path.resolve(process.cwd(), "../backend/src/abis");
    if (!fs.existsSync(front_out_dir)){
        fs.mkdirSync(front_out_dir, { recursive: true });
    }
    if (!fs.existsSync(back_out_dir)){
        fs.mkdirSync(back_out_dir, { recursive: true });
    }


    contracts.forEach(contract_name => {
        const artifact_path = path.join(artifacts_dir, `${contract_name}.sol`, `${contract_name}.json`);
        const front_output_path = path.join(front_out_dir, `${contract_name}.json`);
        const back_output_path = path.join(back_out_dir, `${contract_name}.json`);
        const artifact = JSON.parse(fs.readFileSync(artifact_path, "utf8"));
        const minimal = {
            abi: artifact.abi,
            bytecode: artifact.bytecode,
            deployedBytecode: artifact.deployedBytecode
        };

        fs.writeFileSync(
            front_output_path,
            JSON.stringify(minimal, null, 2),
            "utf8"
        );
        fs.writeFileSync(
            back_output_path,
            JSON.stringify(minimal, null, 2),
            "utf8"
        )
    });
}
