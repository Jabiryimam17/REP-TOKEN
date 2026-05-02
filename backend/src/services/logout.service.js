import {remove_token_cookie} from "#utils/jwt.util.js";

export const logout = (req, res) => {
    try {
        remove_token_cookie(res);

        return true;
    } catch (e) {
        console.error(e);
        return false;
    }


};

export default logout;