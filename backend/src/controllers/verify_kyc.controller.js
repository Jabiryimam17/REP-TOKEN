import verify_service from "#services/verify_kyc.service.js"
export default async (req, res) => {
    try {
        const {id}=req.params;
        const result=await verify_service(id);
        res.status(200).json({message:"User verified", result});
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }


}