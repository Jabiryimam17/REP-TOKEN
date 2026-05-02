import nonce_services from "#services/nonce.service.js"
const nonce_controller=async (req,res)=> {
    try {
        const nonce=await nonce_services();
        res.status(200).json({nonce:nonce});
    } catch (e) {
        console.error(e);
        throw new Error("Internal server error");
    }

}

export default nonce_controller;