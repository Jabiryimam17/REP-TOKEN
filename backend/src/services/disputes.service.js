import db from "../models/index.js";


export default ()=>{
    return db.query("SELECT * FROM disputes")
}
