
import cookie from 'cookie';
import {verify_token} from "#utils/jwt.util.js"
export default function auth_middleware(req, res, next) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers.authorization;

    const user=token && verify_token(token);
    if (!user) return res.status(401).json({message:"Unauthorized"});
    req.user = user;

    req.user.id = user.sub;
    next();
}

export function auth_freelancers_middleware(req, res, next) {
    if (req.user.role !== "freelancer") return res.status(401).json({message:"Unauthorized"});
    next();
}

export function auth_employers_middleware(req, res, next) {
    if (req.user.role !== "employer") return res.status(401).json({message:"Unauthorized"});
    next();
}

export function auth_verifiers_middleware(req, res, next) {
    if (req.user.role !== "verifier") return res.status(401).json({message:"Unauthorized"});
    next();
}

export function auth_admin_middleware(req, res, next) {
    if (req.user.role !== "admin") return res.status(401).json({message:"Unauthorized"});
    next();
}


