import {useState} from 'react';
import axios from "axios";
import sign_message from "../../services/sign_message.service"
export default async (email)=>{
    const [nonce, set_nonce]=useState("");
    const [timestamp, set_timestamp]=useState("");
    const [loading, set_loading]=useState(false);
    const [signature, set_signature]=useState("");
    const [hash_message, set_hash_message]=useState("");

    const response = await axios.get("/api/random_secret");
    set_nonce(response.data.nonce);
    set_timestamp(response.data.timestamp);
    // const message=`Please sign this message to verify your email address for signup.\n\nEmail: ${email}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
    const message = email + nonce + timestamp;
    const handle_sign=()=>{
        const {signature_r,hash}= sign_message(message);
        set_signature(signature_r);
        set_hash_message(hash);
    }

    return {signature,hash,email,nonce,timestamp};

}