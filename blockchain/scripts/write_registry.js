import fs from "fs";
import path from "path";

import {network} from "hardhat";

export default async function main(registry) {
    const {networkName, id} = await network.connect();

    const data = {
        network: networkName,
        chain_id: id,
        registry: registry,
    }
    const dir = path.join(process.cwd(), "../frontend/src/configs");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
    const file_path = path.join(dir, "registry_address.json");
    fs.writeFileSync(file_path, JSON.stringify(data, null, 2), "utf8");
    console.log(`Wrote system addresses to ${file_path}`);
}