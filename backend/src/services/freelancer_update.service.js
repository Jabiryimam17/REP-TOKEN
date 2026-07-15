import db from '#models/index.js';
import {json} from "express";

export default async (user) => {
        const {
            f_name,
            l_name,
            profile_picture,
            title,
            category,
            description,
            bio,
            location,
            skills,
            certifications,
            education_levels,
            qualifications,
            contacts
        } = user;

        await db.query("START TRANSACTION");

        try {
            /* =========================
               UPDATE freelancers
            ========================== */
            await db.query(
                "UPDATE freelancers SET title = ?, category = ?, description = ?, qualifications=?, skills=? WHERE user_id = ?",
                [title, category, description, JSON.stringify(qualifications), JSON.stringify(skills), user.id]
            )
        await db.query(
            "UPDATE users SET f_name = ?, l_name = ?, profile_picture = ?, bio = ?, location = ? WHERE id = ?", [f_name, l_name, profile_picture, bio, location, user.id]
        )

        /* =========================
           CERTIFICATIONS
        ========================== */
        await db.query(
            "DELETE FROM certifications WHERE user_id = ?",
            [user.id]
        );


        const u_certifications = (certifications || []);
        for (const cert of u_certifications) {
            await db.query(
                "INSERT INTO certifications (user_id, title, issuer, year) VALUES (?, ?, ?, ?)",
                [user.id, cert.title, cert.issuer, Number(cert.year)]
            );
        }

        /* =========================
           EDUCATION LEVELS
        ========================== */
        await db.query(
            "DELETE FROM education_levels WHERE user_id = ?",
            [user.id]
        );

        const u_education_levels = (education_levels || []);
        for (const edu of u_education_levels) {
            await db.query(
                `INSERT INTO education_levels
                 (user_id, title, institution, start_year, end_year)
                 VALUES (?, ?, ?, ?, ?)`,
                [user.id, edu.title, edu.institution, Number(edu.start_year), Number(edu.end_year)]
            );
        }

        /* =========================
           CONTACTS
        ========================== */
        await db.query(
            "DELETE FROM contacts WHERE user_id = ?",
            [user.id]
        );

        const ct = contacts || {};
        await db.query(
            `INSERT INTO contacts
             (user_id, github, website, twitter, instagram, telegram, whatsapp, linkedin)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user.id,
                ct.github ?? null,
                ct.website ?? null,
                ct.twitter ?? null,
                ct.instagram ?? null,
                ct.telegram ?? null,
                ct.whatsapp ?? null,
                ct.linkedin ?? null
            ]
        );

        await db.query("COMMIT");
        return true;


    } catch (err) {
        console.error(err);
        await db.query("ROLLBACK");
    }
};
