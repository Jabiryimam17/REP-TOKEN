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
    const front_dir = path.join(process.cwd(), "../frontend/src/configs");
    const back_dir = path.join(process.cwd(), "../backend/src/configs");
    if (!fs.existsSync(front_dir)) {
        fs.mkdirSync(front_dir, {recursive: true});
    }
    if (!fs.existsSync(back_dir)) {
            fs.mkdirSync(back_dir, {recursive: true});
    }
    const front_file_path = path.join(front_dir, "registry_address.json");
    const back_file_path = path.join(back_dir, "registry_address.json");
    fs.writeFileSync(front_file_path, JSON.stringify(data, null, 2), "utf8");
    fs.writeFileSync(back_file_path, JSON.stringify(data, null, 2), "utf8");
    console.log(`Wrote system addresses to ${front_file_path}`);
    console.log(`Wrote system addresses to ${back_file_path}`);
}