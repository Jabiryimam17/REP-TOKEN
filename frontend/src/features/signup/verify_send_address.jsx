import {useState} from 'react';
import sign_message from "../../services/sign_message.service"
export default async (nonce)=>{
    const [signature, set_signature]=useState("");
    const [hash_message, set_hash_message]=useState("");


    // const message=`Please sign this message to verify your email address for signup.\n\nEmail: ${email}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
    const handle_sign=()=>{
        const {signature_r,hash}= sign_message(nonce);
        set_signature(signature_r);
        set_hash_message(hash);
    }

    return {signature,hash_message};

}